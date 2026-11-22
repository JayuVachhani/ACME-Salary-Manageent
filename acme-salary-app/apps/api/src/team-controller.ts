import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from './authentication.js';
import { TeamService, inviteInput, changeInput, versionInput, linkageInput } from './team.js';
import { createInvitationMailer } from './otp-mail.js';
import type { loadConfig } from './config.js';

export function teamController(pool: Pool, config: ReturnType<typeof loadConfig>) {
  const auth = new AuthenticationService(pool,config.OTP_HMAC_SECRET,()=>new Date(),{
    otpMinutes:config.OTP_TTL_MINUTES,idleMinutes:config.SESSION_IDLE_MINUTES,absoluteHours:config.SESSION_ABSOLUTE_HOURS });
  const service = new TeamService(pool,auth);
  const mail = createInvitationMailer(config);
  const token = (req: Request) => req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('acme_session='))?.slice(13) ?? '';
  const csrf = (req: Request) => {
    if (req.headers.origin !== config.APP_ORIGIN || !req.header('X-CSRF-Token')) throw new HttpException('Request rejected',403);
    return req.header('X-CSRF-Token')!;
  };
  const id = (value: string) => { const parsed=z.uuid().safeParse(value); if(!parsed.success) throw new HttpException('Invalid account ID',400); return parsed.data; };
  const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
    const parsed=schema.safeParse(body); if(!parsed.success) throw new HttpException('Invalid team details; check names, email, permissions and version',400); return parsed.data;
  };
  async function notify(account: { id: string; email: string }) {
    try { await mail(account.email); return 'sent'; }
    catch {
      await pool.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
        VALUES('USER',$1,'INVITATION_DELIVERY_FAILED','Invitation saved; email delivery failed')`,[account.id]);
      return 'failed';
    }
  }
  @Controller('/api/v1/team')
  class TeamController {
    @Patch(':id/employee-link') async linkEmployee(@Req() req: Request,@Param('id') accountId: string,@Body() body: unknown) {
      const header=csrf(req);
      return service.linkEmployee(token(req),header,id(accountId),parse(linkageInput,body));
    }
    @Get() async list(@Req() req: Request) {
      const query=z.object({ offset:z.coerce.number().int().min(0).max(100000).default(0) }).strict().safeParse(req.query);
      if(!query.success) throw new HttpException('Invalid page',400);
      return service.list(token(req),query.data.offset);
    }
    @Post() async invite(@Req() req: Request,@Body() body: unknown) {
      const header=csrf(req); const input=parse(inviteInput,body);
      const account=await service.invite(token(req),header,input);
      return { account,delivery:await notify(account) };
    }
    @Patch(':id') async change(@Req() req: Request,@Param('id') accountId: string,@Body() body: unknown) {
      const header=csrf(req); return service.change(token(req),header,id(accountId),parse(changeInput,body));
    }
    @Delete(':id') @HttpCode(200) async remove(@Req() req: Request,@Param('id') accountId: string,@Body() body: unknown) {
      const header=csrf(req); await service.remove(token(req),header,id(accountId),parse(versionInput,body).expectedVersion);
      return { message:'Account removed; access revoked' };
    }
    @Post(':id/reinvite') @HttpCode(200) async reinvite(@Req() req: Request,@Param('id') accountId: string,@Body() body: unknown) {
      const header=csrf(req); const account=await service.reinvite(token(req),header,id(accountId),parse(versionInput,body).expectedVersion);
      return { account,delivery:await notify(account) };
    }
  }
  return TeamController;
}
