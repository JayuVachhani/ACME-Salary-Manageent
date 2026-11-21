import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { readSalarySnapshot } from '../apps/api/dist/report-access.js';
const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL, connectionTimeoutMillis: 5000 });
const client = await pool.connect();
let passed = 0;
const ids = Object.fromEntries(['manager','reader','employee','department','designation','assignment','hold','snapshot','fx1','fx2'].map(k => [k, randomUUID()]));
async function checkFailure(sql, values, expectedCode) {
  await client.query('SAVEPOINT invalid_case');
  try { await assert.rejects(client.query(sql, values), error => error.code===expectedCode); passed++; }
  finally { await client.query('ROLLBACK TO SAVEPOINT invalid_case'); }
}
try {
  await client.query('BEGIN');
  await client.query(`INSERT INTO users(id,email,full_name,status,is_hr_manager,permissions) VALUES
    ($1,$2,'Synthetic Manager','ACTIVE',true,ARRAY['read']),($3,$4,'Synthetic Reader','ACTIVE',false,ARRAY['read','salary:view','export'])`,
    [ids.manager,`${ids.manager}@acme.test`,ids.reader,`${ids.reader}@acme.test`]);
  await client.query("INSERT INTO currencies(code,minor_units) VALUES('USD',2),('INR',2) ON CONFLICT DO NOTHING");
  await client.query("INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by) VALUES('ZZ','Synthetic Test Country','USD',2,'HALF_UP',$1)", [ids.manager]);
  await client.query('INSERT INTO departments(id,name) VALUES($1,$2)',[ids.department,`Synthetic ${ids.department}`]);
  await client.query('INSERT INTO designations(id,name) VALUES($1,$2)',[ids.designation,`Synthetic ${ids.designation}`]);
  await client.query("INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,$2,$3,'Synthetic','Employee','2026-01-01',$4)",
    [ids.employee,ids.employee.toUpperCase(),`${ids.employee}@acme.test`,ids.manager]);
  const assignment = `INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by)
    VALUES($1,'ZZ',$2,$3,'ACTIVE',$4,'Synthetic test',$5)`;
  await checkFailure(assignment,[ids.employee,ids.department,ids.designation,'2025-12-31',ids.manager],'23514');
  await client.query(assignment,[ids.employee,ids.department,ids.designation,'2026-01-01',ids.manager]);
  await checkFailure(assignment,[ids.employee,ids.department,ids.designation,'2026-01-01',ids.manager],'23505');
  await client.query(assignment,[ids.employee,ids.department,ids.designation,'2026-12-01',ids.manager]);
  assert.equal((await client.query('SELECT effective_from::text FROM employee_assignments WHERE employee_id=$1 AND effective_from <= $2 ORDER BY effective_from DESC LIMIT 1',[ids.employee,'2026-11-21'])).rows[0].effective_from,'2026-01-01'); passed++;

  const fxSql = `INSERT INTO fx_rate_revisions(id,base_currency,quote_currency,effective_date,revision,rate,source,reason,created_by)
    VALUES($1,'USD','INR','2026-11-20',$2,$3,'SYNTHETIC','Test correction',$4)`;
  await checkFailure(fxSql,[ids.fx1,1,'80',ids.reader],'42501');
  await client.query(fxSql,[ids.fx1,1,'80',ids.manager]);
  await client.query(fxSql,[ids.fx2,2,'81',ids.manager]);
  await checkFailure(fxSql,[randomUUID(),2,'82',ids.manager],'40001');
  assert.deepEqual((await client.query('SELECT rate::text,source,created_by FROM fx_rate_revisions WHERE id=ANY($1::uuid[]) ORDER BY revision',[ [ids.fx1,ids.fx2] ])).rows.map(r=>r.rate),['80.00000000','81.00000000']); passed++;
  for (const table of ['fx_rate_revisions','employee_assignments','retention_holds','retention_hold_releases']) {
    await checkFailure(`TRUNCATE ${table} CASCADE`,[],'55000');
  }
  await checkFailure('UPDATE fx_rate_revisions SET rate=90 WHERE id=$1',[ids.fx1],'55000');
  assert.equal((await client.query("SELECT count(*)::int AS n FROM audit_logs WHERE entity_type='FX_RATE' AND entity_id=ANY($1::text[])",[[ids.fx1,ids.fx2]])).rows[0].n,2); passed++;

  await checkFailure('INSERT INTO retention_holds(employee_id,reason,placed_by) VALUES($1,$2,$3)',[ids.employee,'Test hold',ids.reader],'42501');
  await client.query('INSERT INTO retention_holds(id,employee_id,reason,placed_by) VALUES($1,$2,$3,$4)',[ids.hold,ids.employee,'Synthetic legal hold',ids.manager]);
  await checkFailure('UPDATE employees SET removed_at=now() WHERE id=$1',[ids.employee],'55000');
  await checkFailure('DELETE FROM employees WHERE id=$1',[ids.employee],'55000');
  await client.query('INSERT INTO retention_hold_releases(hold_id,reason,released_by) VALUES($1,$2,$3)',[ids.hold,'Synthetic hold released',ids.manager]);
  await checkFailure('DELETE FROM retention_holds WHERE id=$1',[ids.hold],'55000');

  const createSnapshot = async () => {
    const id = randomUUID();
    await client.query(`INSERT INTO report_snapshots(id,owner_id,authorization_version,as_of,target_currency,filters,payload,created_at,expires_at)
      SELECT $1,id,authorization_version,'2026-11-21','USD','{}','{"synthetic":true}',now(),now()+interval '30 minutes' FROM users WHERE id=$2`,[id,ids.reader]);
    await client.query('INSERT INTO report_snapshot_employees(snapshot_id,employee_id) VALUES($1,$2)',[id,ids.employee]);
    return id;
  };
  const first = await createSnapshot();
  assert.deepEqual((await readSalarySnapshot(client,ids.reader,first,true)).payload,{synthetic:true}); passed++;
  await assert.rejects(readSalarySnapshot(client,ids.manager,first,true), /SNAPSHOT_UNAVAILABLE/); passed++;
  await assert.rejects(readSalarySnapshot(client,ids.reader,first,true,new Date('2100-01-01')),/SNAPSHOT_UNAVAILABLE/); passed++;
  await client.query("UPDATE users SET permissions=ARRAY['read','salary:view'] WHERE id=$1",[ids.reader]);
  await assert.rejects(readSalarySnapshot(client,ids.reader,first,true),/ACCESS_DENIED/); passed++;
  await assert.rejects(readSalarySnapshot(client,ids.reader,first,false),/SNAPSHOT_UNAVAILABLE/); passed++;
  const second = await createSnapshot();
  await client.query('UPDATE employees SET removed_at=now() WHERE id=$1',[ids.employee]);
  await assert.rejects(readSalarySnapshot(client,ids.reader,second,false),/SNAPSHOT_UNAVAILABLE/); passed++;
  assert.equal((await client.query('SELECT count(*)::int AS n FROM audit_logs WHERE entity_type=\'RETENTION_HOLD\' AND entity_id=$1',[ids.hold])).rows[0].n,2); passed++;
  console.log(`${passed} PostgreSQL country/FX/retention/snapshot checks passed (synthetic fixtures rolled back)`);
} finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
