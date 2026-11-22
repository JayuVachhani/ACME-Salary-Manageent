import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { MailService } from './mail.service.js';
import { OtpDeliveries } from './otp-deliveries.service.js';
@Module({
  imports: [ConfigModule],
  providers: [MailService, OtpDeliveries],
  exports: [MailService, OtpDeliveries],
})
export class MailModule {}
