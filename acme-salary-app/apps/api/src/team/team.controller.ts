import { Inject } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { TeamService, inviteInput, changeInput, versionInput } from './team.service.js';
import { INVITATION_MAILER, type InvitationMailer } from '../mail/mail.module.js';
@Controller('/api/v1/team')
export class TeamController {
  constructor(
    @Inject(TeamService) private readonly service: TeamService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(Pool) private readonly pool: Pool,
    @Inject(INVITATION_MAILER) private readonly mail: InvitationMailer) { }
  private readonly token = (req: Request) => req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('acme_session='))?.slice(13) ?? '';
  private readonly csrf = (req: Request) => {
    if (req.headers.origin !== this.config.APP_ORIGIN || !req.header('X-CSRF-Token'))
      throw new HttpException('Request rejected', 403);
    return req.header('X-CSRF-Token')!;
  };
  private readonly id = (value: string) => {
    const parsed = z.uuid().safeParse(value); if (!parsed.success)
      throw new HttpException('Invalid account ID', 400); return parsed.data;
  };
  private readonly parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      throw new HttpException('Invalid team details; check names, email, permissions and version', 400);
    return parsed.data;
  };
  private async notify(account: {
    id: string;
    email: string;
  }) {
    try {
      await this.mail(account.email);
      return 'sent';
    }
    catch {
      await this.pool.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
    VALUES('USER',$1,'INVITATION_DELIVERY_FAILED','Invitation saved; email delivery failed')`, [account.id]);
      return 'failed';
    }
  }
  @Get()
  async list(
    @Req() req: Request) {
    const query = z.object({ offset: z.coerce.number().int().min(0).max(100000).default(0) }).strict().safeParse(req.query);
    if (!query.success)
      throw new HttpException('Invalid page', 400);
    return this.service.list(this.token(req), query.data.offset);
  }
  @Post()
  async invite(
    @Req() req: Request,
    @Body() body: unknown) {
    const header = this.csrf(req);
    const input = this.parse(inviteInput, body);
    const account = await this.service.invite(this.token(req), header, input);
    return { account, delivery: await this.notify(account) };
  }
  @Patch(':id')
  async change(
    @Req() req: Request,
    @Param('id') accountId: string,
    @Body() body: unknown) {
    const header = this.csrf(req);
    return this.service.change(this.token(req), header, this.id(accountId), this.parse(changeInput, body));
  }
  @Delete(':id')
  @HttpCode(200)
  async remove(
    @Req() req: Request,
    @Param('id') accountId: string,
    @Body() body: unknown) {
    const header = this.csrf(req);
    await this.service.remove(this.token(req), header, this.id(accountId), this.parse(versionInput, body).expectedVersion);
    return { message: 'Account removed; access revoked' };
  }
  @Post(':id/reinvite')
  @HttpCode(200)
  async reinvite(
    @Req() req: Request,
    @Param('id') accountId: string,
    @Body() body: unknown) {
    const header = this.csrf(req);
    const account = await this.service.reinvite(this.token(req), header, this.id(accountId), this.parse(versionInput, body).expectedVersion);
    return { account, delivery: await this.notify(account) };
  }
}
