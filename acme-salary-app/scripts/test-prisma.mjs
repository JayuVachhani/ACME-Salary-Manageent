import assert from 'node:assert/strict';
import { createDatabase } from '../apps/api/dist/database/prisma.js';
const db = createDatabase(process.env.DATABASE_URL);
try {
  const system = await db.users.findMany({ where: { is_system: true }, select: { id:true, is_hr_manager:true, permissions:true } });
  assert.equal(system.length,1);
  assert.equal(system[0].is_hr_manager,false);
  assert.deepEqual(system[0].permissions,[]);
  assert.equal(await db.salary_records.count(),0);
  console.log('Prisma runtime adapter checks passed: restricted role, system identity and typed ledger query');
} finally { await db.$disconnect(); }
