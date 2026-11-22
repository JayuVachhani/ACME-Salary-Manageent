import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { offsetQuery } from '../common/dto/pagination.dto.js';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { TeamService } from './team.service.js';
import { TeamNotifications } from './team-notifications.service.js';
import { inviteInput, changeInput, versionInput, accountId } from './dto/team.dto.js';
const invalid = 'Invalid team details; check names, email, permissions and version';
@Controller('/api/v1/team')
@UseGuards(MutationRequestGuard)
export class TeamController {
  constructor(@Inject(RequestSecurity) private readonly security: RequestSecurity, @Inject(TeamService) private readonly service: TeamService, @Inject(TeamNotifications) private readonly notifications: TeamNotifications) {}
  @Get()
  list(@Req() req: Request, @Query(new ZodValidationPipe(offsetQuery, 'Invalid page')) query: z.infer<typeof offsetQuery>) { return this.service.list(this.security.token(req), query.offset); }
  @Post()
  async invite(@Req() req: Request, @Body(new ZodValidationPipe(inviteInput, invalid)) body: z.infer<typeof inviteInput>) {
    const account = await this.service.invite(this.security.token(req), this.security.csrf(req), body);
    return { account, delivery: await this.notifications.notify(account) };
  }
  @Patch(':id')
  change(@Req() req: Request, @Param('id', new ZodValidationPipe(accountId, 'Invalid account ID')) id: string, @Body(new ZodValidationPipe(changeInput, invalid)) body: z.infer<typeof changeInput>) { return this.service.change(this.security.token(req), this.security.csrf(req), id, body); }
  @Delete(':id') @HttpCode(200)
  async remove(@Req() req: Request, @Param('id', new ZodValidationPipe(accountId, 'Invalid account ID')) id: string, @Body(new ZodValidationPipe(versionInput, invalid)) body: z.infer<typeof versionInput>) {
    await this.service.remove(this.security.token(req), this.security.csrf(req), id, body.expectedVersion);
    return { message: 'Account removed; access revoked' };
  }
  @Post(':id/reinvite') @HttpCode(200)
  async reinvite(@Req() req: Request, @Param('id', new ZodValidationPipe(accountId, 'Invalid account ID')) id: string, @Body(new ZodValidationPipe(versionInput, invalid)) body: z.infer<typeof versionInput>) {
    const account = await this.service.reinvite(this.security.token(req), this.security.csrf(req), id, body.expectedVersion);
    return { account, delivery: await this.notifications.notify(account) };
  }
}
