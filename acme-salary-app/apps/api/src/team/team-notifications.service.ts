import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { MailService } from '../mail/mail.service.js';
/** Called after the account mutation commits; failed SMTP never rolls back an invitation. */
@Injectable()
export class TeamNotifications {
  constructor(
  @Inject(Pool) private readonly pool: Pool,
  @Inject(MailService) private readonly mail: MailService) { }
  async notify(account: {
    id: string;
    email: string;
  }) {
    try {
      await this.mail.invitation(account.email);
      return 'sent' as const;
    }
    catch {
      try {
        await this.pool.query(`INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
          VALUES('USER',$1,'INVITATION_DELIVERY_FAILED','Invitation saved; email delivery failed')`, [account.id]);
        return 'failed' as const;
      } catch {
        // No credentials/employee values in fallback telemetry. No claim that the database audit persisted.
        process.stderr.write('{"event":"invitation_failure_audit_unavailable"}\n');
        return 'failed_audit_unavailable' as const;
      }
    }
  }
}
