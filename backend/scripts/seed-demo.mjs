import { createHash } from 'node:crypto';
import { Client } from 'pg';

const args = process.argv.slice(2);
const requestedCount = Number(args[args.indexOf('--employees') + 1]);
const count = args.includes('--employees') ? requestedCount : 10000;
if (
  !args.includes('--confirm-synthetic') ||
  !Number.isInteger(count) ||
  count < 25 ||
  count > 15000
)
  throw new Error(
    'Usage: npm run db:seed:demo -- --employees 10000 --confirm-synthetic (25–15000)',
  );
let target;
try {
  target = new URL(process.env.MIGRATION_DATABASE_URL ?? '');
} catch {
  throw new Error('A valid local MIGRATION_DATABASE_URL is required for demo seeding.');
}
if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
  target.pathname !== '/acme_app'
)
  throw new Error('Demo seed is restricted to local acme_app, outside production.');
const dataset = 'acme-demo-v1';
function id(name) {
  const hex = createHash('sha256')
    .update(dataset + ':' + name)
    .digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
const client = new Client({
  connectionString: target.href,
  connectionTimeoutMillis: 5000,
  query_timeout: 0,
});
await client.connect();
try {
  await client.query('BEGIN');
  await client.query('SET LOCAL statement_timeout=0');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('acme_demo_seed'))");
  const marker = (
    await client.query(
      "SELECT payload FROM audit_logs WHERE entity_type='DEMO_SEED' AND entity_id=$1",
      [dataset],
    )
  ).rows[0];
  if (marker) {
    console.log(
      'Demo dataset already exists; preserving all records and manual edits.',
      JSON.stringify(marker.payload),
    );
    await client.query('COMMIT');
  } else {
    const bootstrap = (
      await client.query(
        "SELECT id FROM users WHERE status='ACTIVE' AND is_hr_manager AND NOT is_system AND email::text NOT LIKE 'demo.%' ORDER BY created_at,id LIMIT 1",
      )
    ).rows[0]?.id;
    if (!bootstrap) throw new Error('Create the first HR manager before seeding.');
    const currency = (
      await client.query(
        "SELECT code FROM currencies WHERE is_active AND minor_units IS NOT NULL ORDER BY (code='USD') DESC,code LIMIT 1",
      )
    ).rows[0]?.code;
    if (!currency)
      throw new Error('Activate one salary currency in Countries & currencies before seeding.');
    await client.query("SELECT set_config('acme.team_actor',$1,true)", [bootstrap]);
    await client.query("SELECT set_config('acme.reference_actor',$1,true)", [bootstrap]);
    for (const [key, email, name, hr, permissions] of [
      ['hr1', 'demo.hr1@acme.test', 'DEMO HR Manager One', true, ['read']],
      ['hr2', 'demo.hr2@acme.test', 'DEMO HR Manager Two', true, ['read']],
      ['viewer', 'demo.viewer@acme.test', 'DEMO Read Only', false, ['read']],
      [
        'editor',
        'demo.editor@acme.test',
        'DEMO Employee Editor',
        false,
        ['read', 'write', 'edit', 'salary:view'],
      ],
    ])
      await client.query(
        "INSERT INTO users(id,email,full_name,is_hr_manager,permissions,status,invited_by) VALUES($1,$2,$3,$4,$5,'ACTIVE',$6)",
        [id(key), email, name, hr, permissions, bootstrap],
      );
    const departmentIds = [];
    const designationIds = [];
    for (const [table, names, ids] of [
      ['departments', ['Engineering', 'Operations', 'People'], departmentIds],
      ['designations', ['Analyst', 'Specialist', 'Manager'], designationIds],
    ]) {
      for (const name of names) {
        const referenceId = id(table + name);
        ids.push(referenceId);
        await client.query(`INSERT INTO ${table}(id,name) VALUES($1,$2)`, [
          referenceId,
          '[DEMO] ' + name,
        ]);
      }
    }
    for (const [code, name] of [
      ['XZ', 'North'],
      ['XY', 'South'],
      ['XW', 'West'],
    ])
      await client.query(
        `INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by,regulations_meta) VALUES($1,$2,$3,2,'HALF_UP',$4,$5)`,
        [
          code,
          '[DEMO] ' + name + ' region',
          currency,
          bootstrap,
          JSON.stringify({
            synthetic: true,
            dataset,
            note: 'Fictional demo policy; not a real country or legal rule.',
          }),
        ],
      );
    const employees = Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      id: id('employee-' + (i + 1)),
      request: id('request-' + (i + 1)),
      salary: id('salary-' + (i + 1)),
    }));
    console.log(`Creating ${count} DEMO employees and dated assignments…`);
    await client.query(
      `INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by)
      SELECT x.id::uuid,'DEMO-'||lpad(x.n::text,5,'0'),'demo.employee'||lpad(x.n::text,5,'0')||'@acme.test','Demo Employee',lpad(x.n::text,5,'0'),(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date-180,$2::uuid
      FROM jsonb_to_recordset($1::jsonb) AS x(n int,id text)`,
      [JSON.stringify(employees), bootstrap],
    );
    await client.query(
      `INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by)
      SELECT x.id::uuid,(ARRAY['XZ','XY','XW'])[(x.n-1)%3+1],($2::uuid[])[(x.n-1)%3+1],($3::uuid[])[(x.n-1)%3+1],CASE WHEN x.n%25=0 THEN 'INACTIVE' ELSE 'ACTIVE' END,(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date-180,'Synthetic demo assignment',$4::uuid
      FROM jsonb_to_recordset($1::jsonb) AS x(n int,id text)`,
      [JSON.stringify(employees), departmentIds, designationIds, bootstrap],
    );
    // Independent existing HR links demo accounts; never change the current user's own linkage.
    await client.query(
      "SELECT set_config('acme.link_actor',$1,true),set_config('acme.link_reason','Synthetic demo account linkage',true),set_config('acme.link_confirmed','true',true)",
      [bootstrap],
    );
    for (const [key, number] of [
      ['hr1', 1],
      ['hr2', 2],
      ['editor', 3],
    ])
      await client.query('UPDATE users SET employee_id=$2 WHERE id=$1', [
        id(key),
        id('employee-' + number),
      ]);
    console.log('Creating pending initial requests through the normal database guards…');
    await client.query(
      `INSERT INTO salary_change_requests(id,employee_id,requested_by,submitted_business_date,effective_from,expected_employee_version,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,reason,conversion_meta,request_kind)
      SELECT x.request::uuid,e.id,CASE WHEN x.n<=2 THEN $2::uuid ELSE $3::uuid END,(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,
      CASE WHEN x.n%100=0 THEN (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date+30 ELSE e.joining_date END,e.version,(3000+(x.n%150)*125)::numeric,c.default_currency,c.country_code,c.default_currency,c.version,c.decimal_places,c.rounding_mode,'Synthetic initial monthly salary','{}','INITIAL'
      FROM jsonb_to_recordset($1::jsonb) AS x(n int,id text,request text) JOIN employees e ON e.id=x.id::uuid JOIN employee_assignments a ON a.employee_id=e.id JOIN country_rules c ON c.country_code=a.country_code`,
      [JSON.stringify(employees), bootstrap, id('hr1')],
    );
    console.log(`Approving ${count - 10} initial salaries; leaving 8 pending and 2 rejected…`);
    await client.query(
      `INSERT INTO salary_approval_decisions(request_id,decision,decided_by,comment)
      SELECT x.request::uuid,CASE WHEN x.n>$2-2 THEN 'REJECTED' ELSE 'APPROVED' END,CASE WHEN x.n=2 THEN $3::uuid ELSE $4::uuid END,
      CASE WHEN x.n>$2-2 THEN 'Synthetic rejection: revise the initial salary and resubmit.' ELSE 'Synthetic independent initial approval.' END
      FROM jsonb_to_recordset($1::jsonb) AS x(n int,request text) WHERE x.n<=$2-10 OR x.n>$2-2`,
      [JSON.stringify(employees), count, id('hr1'), id('hr2')],
    );
    await client.query(
      `INSERT INTO salary_records(id,employee_id,approval_request_id,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,approval_status,change_reason,conversion_meta,created_by)
      SELECT x.salary::uuid,r.employee_id,r.id,r.monthly_amount,r.currency,r.country_code,r.default_currency,r.country_rule_version,r.decimal_places,r.rounding_mode,r.effective_from,r.submitted_business_date,'ACTIVE',r.reason,r.conversion_meta,r.requested_by
      FROM jsonb_to_recordset($1::jsonb) AS x(n int,request text,salary text) JOIN salary_change_requests r ON r.id=x.request::uuid WHERE x.n<=$2-10`,
      [JSON.stringify(employees), count],
    );
    const summary = {
      dataset,
      employees: count,
      approved: count - 10,
      pending: 8,
      rejected: 2,
      currency,
      synthetic: true,
    };
    await client.query(
      "INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload) VALUES($1,'DEMO_SEED',$2,'CREATED','Explicit local synthetic demo seed',$3)",
      [bootstrap, dataset, JSON.stringify(summary)],
    );
    await client.query('COMMIT');
    console.log('Demo dataset committed.', JSON.stringify(summary));
    console.log(
      'Sign in: demo.hr1@acme.test, demo.hr2@acme.test, demo.editor@acme.test, demo.viewer@acme.test. Read OTPs in local Mailpit.',
    );
  }
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Demo seed rolled back; existing data preserved.');
  throw error;
} finally {
  await client.end();
}
