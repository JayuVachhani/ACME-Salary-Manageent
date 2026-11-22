import { OtpDeliveries } from './otp-deliveries.service.js';
import { Module } from '@nestjs/common';
import { ConfigModule, APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { createOtpMailer, createInvitationMailer } from './otp-mail.js';
export const OTP_MAILER = Symbol('OTP_MAILER');
export const INVITATION_MAILER = Symbol('INVITATION_MAILER');
export type OtpMailer = ReturnType<typeof createOtpMailer>;
export type InvitationMailer = ReturnType<typeof createInvitationMailer>;
@Module({
  imports: [ConfigModule], providers: [OtpDeliveries,
    { provide: OTP_MAILER, inject: [APP_CONFIG], useFactory: (config: AppConfig) => createOtpMailer(config) },
    { provide: INVITATION_MAILER, inject: [APP_CONFIG], useFactory: (config: AppConfig) => createInvitationMailer(config) },
  ], exports: [OtpDeliveries, OTP_MAILER, INVITATION_MAILER]
})
export class MailModule {
}
