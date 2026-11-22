import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Runtime credentials only. SQL migrations use a separate owner connection. */
export function createDatabase(connectionString: string) {
  const adapter = new PrismaPg({ connectionString, max: 10, connectionTimeoutMillis: 5000,
    statement_timeout: 5000, idle_in_transaction_session_timeout: 10000 });
  // Query logging stays disabled: parameters can contain confidential compensation values.
  return new PrismaClient({ adapter, log: [] });
}
