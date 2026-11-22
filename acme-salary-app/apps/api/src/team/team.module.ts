import { TeamNotifications } from './team-notifications.service.js';
import { HttpModule } from '../common/http/http.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { TeamController } from './team.controller.js';
import { TeamService } from './team.service.js';
@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule, AuthModule, MailModule], controllers: [TeamController], providers: [TeamService, TeamNotifications
  ]
})
export class TeamModule {
}
