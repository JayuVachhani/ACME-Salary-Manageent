import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import type { MailService } from '../mail/mail.service';
import { TeamNotifications } from './team-notifications.service';

describe('committed invitation delivery outcome', () => {
  it('reports both failed delivery and unavailable failure audit without throwing an unsaved result', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('database unavailable')),
    } as unknown as Pool;
    const mail = {
      invitation: vi.fn().mockRejectedValue(new Error('SMTP unavailable')),
    } as unknown as MailService;
    const notifications = new TeamNotifications(pool, mail);
    await expect(
      notifications.notify({ id: 'synthetic', email: 'synthetic@acme.test' }),
    ).resolves.toBe('failed_audit_unavailable');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
