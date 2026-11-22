import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OffsetQueryDto } from '../common/dto/pagination.dto.js';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import {
  ApiErrors,
  ApiInput,
  ApiMutation,
  ApiResult,
  ApiSession,
} from '../common/http/api-contract.decorators.js';
import { TeamService } from './team.service.js';
import { TeamInvitationsService } from './team-invitations.service.js';
import {
  AccountParamsDto,
  InviteMemberDto,
  ChangeMemberDto,
  MemberVersionDto,
  LinkEmployeeDto,
} from './dto/team.dto.js';
import { invitationResponse, memberResponse, teamPageResponse } from './dto/team-response.dto.js';
import { messageResponse } from '../common/dto/message-response.dto.js';

@ApiTags('Team')
@ApiSession()
@ApiErrors(400, 401, 403, 409, 500)
@Controller('/api/v1/team')
@UseGuards(MutationRequestGuard)
export class TeamController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(TeamService) private readonly service: TeamService,
    @Inject(TeamInvitationsService) private readonly invitations: TeamInvitationsService,
  ) {}

  @Patch(':id/employee-link')
  @ApiMutation()
  @ApiInput(AccountParamsDto, 'path')
  @ApiInput(LinkEmployeeDto, 'body')
  @ApiResult(memberResponse)
  linkEmployee(
    @Req() req: Request,
    @Param() params: AccountParamsDto,
    @Body() body: LinkEmployeeDto,
  ) {
    return this.service.linkEmployee(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body,
    );
  }

  @Get()
  @ApiInput(OffsetQueryDto, 'query')
  @ApiResult(teamPageResponse)
  list(@Req() req: Request, @Query() query: OffsetQueryDto) {
    return this.service.list(this.security.token(req), query.offset);
  }

  @Post()
  @ApiMutation()
  @ApiInput(InviteMemberDto, 'body')
  @ApiResult(invitationResponse, 201)
  invite(@Req() req: Request, @Body() body: InviteMemberDto) {
    return this.invitations.invite(this.security.token(req), this.security.csrf(req), body);
  }

  @Patch(':id')
  @ApiMutation()
  @ApiInput(AccountParamsDto, 'path')
  @ApiInput(ChangeMemberDto, 'body')
  @ApiResult(memberResponse)
  change(@Req() req: Request, @Param() params: AccountParamsDto, @Body() body: ChangeMemberDto) {
    return this.service.change(this.security.token(req), this.security.csrf(req), params.id, body);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiMutation()
  @ApiInput(AccountParamsDto, 'path')
  @ApiInput(MemberVersionDto, 'body')
  @ApiResult(messageResponse)
  async remove(
    @Req() req: Request,
    @Param() params: AccountParamsDto,
    @Body() body: MemberVersionDto,
  ) {
    await this.service.remove(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.expectedVersion,
    );
    return { message: 'Account removed; access revoked' };
  }

  @Post(':id/reinvite')
  @HttpCode(200)
  @ApiMutation()
  @ApiInput(AccountParamsDto, 'path')
  @ApiInput(MemberVersionDto, 'body')
  @ApiResult(invitationResponse)
  reinvite(@Req() req: Request, @Param() params: AccountParamsDto, @Body() body: MemberVersionDto) {
    return this.invitations.reinvite(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.expectedVersion,
    );
  }
}
