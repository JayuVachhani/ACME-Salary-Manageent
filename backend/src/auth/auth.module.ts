import { AuthOriginGuard } from './auth-origin.guard.js';
import { AuthService } from './auth.service.js';
import { HttpModule } from '../common/http/http.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { MailModule } from '../mail/mail.module.js';
import { AuthenticationService } from './authentication.service.js';
import { AuthController } from './auth.controller.js';
@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule, MailModule],
  controllers: [AuthController],
  providers: [AuthenticationService, AuthService, AuthOriginGuard],
  exports: [AuthenticationService],
})
export class AuthModule {}
