import { Inject, Injectable } from '@nestjs/common';
import type { InviteMemberDto } from './dto/team.dto.js';
import { TeamService } from './team.service.js';
import { TeamNotifications } from './team-notifications.service.js';

/** Application workflow: commit the account change before attempting notification delivery. */
@Injectable()
export class TeamInvitationsService {
  constructor(@Inject(TeamService) private readonly team: TeamService,
    @Inject(TeamNotifications) private readonly notifications: TeamNotifications) {}

  async invite(token: string, csrf: string, input: InviteMemberDto) {
    const account = await this.team.invite(token, csrf, input);
    return this.deliver(account);
  }

  async reinvite(token: string, csrf: string, id: string, expectedVersion: number) {
    const account = await this.team.reinvite(token, csrf, id, expectedVersion);
    return this.deliver(account);
  }

  private async deliver<T extends { id: string; email: string }>(account: T) {
    return { account, delivery: await this.notifications.notify(account) };
  }
}
