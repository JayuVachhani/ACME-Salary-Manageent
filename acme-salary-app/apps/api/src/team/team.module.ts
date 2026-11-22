import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthenticationService } from '../auth/authentication.service.js';
import { MailModule } from '../mail/mail.module.js';
import { TeamController } from './team.controller.js';
import { TeamService } from './team.service.js';
@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, MailModule], controllers: [TeamController], providers: [
    {
      provide: TeamService, inject: [Pool, AuthenticationService],
      useFactory: (pool: Pool, auth: AuthenticationService) => new TeamService(pool, auth)
    },
  ]
})
export class TeamModule {
}
