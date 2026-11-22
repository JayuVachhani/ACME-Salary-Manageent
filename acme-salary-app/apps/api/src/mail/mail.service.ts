import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { createOtpMailer, createInvitationMailer } from './otp-mail.js';
@Injectable()
export class MailService {
  private readonly sendOtp;
  private readonly sendInvitation;
  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.sendOtp = createOtpMailer(config);
    this.sendInvitation = createInvitationMailer(config);
  }
  otp(email: string, code: string): Promise<void> {
    return this.sendOtp(email, code);
  }
  invitation(email: string): Promise<void> {
    return this.sendInvitation(email);
  }
}
