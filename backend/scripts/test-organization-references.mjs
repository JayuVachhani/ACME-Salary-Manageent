import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Client, Pool } from 'pg';
import { AuthenticationService } from '../dist/auth/authentication.service.js';
import { OrganizationReferencesService } from '../dist/organization-references/organization-references.service.js';
const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL),
  runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href });
await admin.connect();
let created = false,
  owner,
  pool,
  passed = 0;
const ok = (label) => console.log(`PASS REF-DB-${String(++passed).padStart(2, '0')} ${label}`);
const denied = (work, status) => assert.rejects(work, (error) => error.status === status);
try {
  await admin.query(`CREATE DATABASE ${name}`);
  created = true;
  ownerUrl.pathname = runtimeUrl.pathname = `/${name}`;
  execFileSync(process.execPath, ['scripts/migrate.mjs'], {
    env: { ...process.env, MIGRATION_DATABASE_URL: ownerUrl.href },
    stdio: 'pipe',
    windowsHide: true,
  });
  owner = new Client({ connectionString: ownerUrl.href });
  await owner.connect();
  pool = new Pool({ connectionString: runtimeUrl.href, max: 6 });
  const actor = randomUUID(),
    reader = randomUUID();
  await owner.query(
    `INSERT INTO users(id,email,full_name,status,is_hr_manager) VALUES
    ($1,'reference.hr@acme.test','Synthetic HR','ACTIVE',true),($2,'reference.reader@acme.test','Synthetic Reader','ACTIVE',false)`,
    [actor, reader],
  );
  const auth = new AuthenticationService(
      pool,
      'synthetic-reference-test-secret-at-least-32-characters',
    ),
    service = new OrganizationReferencesService(pool, auth);
  const login = async (email) => {
    const issued = await auth.issue(email);
    return auth.verify(issued.challengeId, issued.code);
  };
  const hr = await login('reference.hr@acme.test'),
    member = await login('reference.reader@acme.test');
  await denied(service.list('', 'departments'), 401);
  await denied(service.list(member.token, 'departments'), 403);
  ok('anonymous and non-HR reads denied');
  await denied(service.create(member.token, member.csrf, 'departments', { name: 'Denied' }), 403);
  await denied(service.create(hr.token, '', 'departments', { name: 'Denied' }), 403);
  await denied(service.create(hr.token, 'invalid', 'departments', { name: 'Denied' }), 403);
  ok('non-HR writes and invalid CSRF denied');
  for (const kind of ['departments', 'designations']) {
    const item = await service.create(hr.token, hr.csrf, kind, { name: '  People Operations  ' });
    assert.equal(item.name, 'People Operations');
    assert.equal(item.version, 1);
    ok(`${kind} trim names and preserve display casing`);
    await denied(service.create(hr.token, hr.csrf, kind, { name: 'people operations' }), 409);
    ok(`${kind} case-insensitive duplicate rejected`);
    const changed = await service.change(hr.token, hr.csrf, kind, item.id, {
      name: 'People Services',
      isActive: false,
      expectedVersion: 1,
    });
    assert.equal(changed.version, 2);
    assert.equal(changed.is_active, false);
    await denied(
      service.change(hr.token, hr.csrf, kind, item.id, {
        name: 'Lost update',
        isActive: true,
        expectedVersion: 1,
      }),
      409,
    );
    ok(`${kind} stale changes rejected`);
    await denied(service.create(hr.token, hr.csrf, kind, { name: 'people services' }), 409);
    ok(`${kind} inactive names still reserved`);
    await assert.rejects(
      owner.query(`DELETE FROM ${kind} WHERE id=$1`, [item.id]),
      (e) => e.code === '55000',
    );
    await assert.rejects(
      owner.query(`UPDATE ${kind} SET id=$2 WHERE id=$1`, [item.id, randomUUID()]),
      (e) => e.code === '55000',
    );
    await assert.rejects(owner.query(`TRUNCATE ${kind} CASCADE`), (e) => e.code === '55000');
    ok(`${kind} direct deletion, truncate and identity mutation blocked`);
    await service.change(hr.token, hr.csrf, kind, item.id, {
      name: 'People Services',
      isActive: true,
      expectedVersion: 2,
    });
    const race = await Promise.allSettled(
      [false, true].map((isActive) =>
        service.change(hr.token, hr.csrf, kind, item.id, {
          name: 'People Services',
          isActive,
          expectedVersion: 3,
        }),
      ),
    );
    assert.equal(race.filter((r) => r.status === 'fulfilled').length, 1);
    ok(`${kind} concurrent edits have one winner`);
    await assert.rejects(
      owner.query(`INSERT INTO ${kind}(name) VALUES(' untrimmed ')`),
      (e) => e.code === '23514',
    );
    ok(`${kind} SQL normalization constraint enforced`);
    await assert.rejects(
      owner.query(`INSERT INTO ${kind}(name) VALUES($1)`, ['\tUntrimmed\t']),
      (e) => e.code === '23514',
    );
    await assert.rejects(
      owner.query(`INSERT INTO ${kind}(name) VALUES($1)`, ['x'.repeat(201)]),
      (e) => e.code === '23514',
    );
    ok(`${kind} SQL whitespace and length bounds enforced`);
  }
  const department = (await owner.query('SELECT id FROM departments LIMIT 1')).rows[0].id,
    designation = (await owner.query('SELECT id FROM designations LIMIT 1')).rows[0].id;
  await owner.query("INSERT INTO currencies(code,minor_units) VALUES('USD',2)");
  await owner.query(
    "INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,updated_by) VALUES('US','Synthetic Country','USD',2,'HALF_UP',$1)",
    [actor],
  );
  const employee = randomUUID();
  await owner.query(
    "INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,'SYN-REF','employee.ref@acme.test','Synthetic','Employee','2020-01-01',$2)",
    [employee, actor],
  );
  await owner.query('UPDATE departments SET is_active=true');
  await owner.query('UPDATE designations SET is_active=true');
  const assignment = (date) =>
    owner.query(
      "INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by) VALUES($1,'US',$2,$3,'ACTIVE',$4,'Synthetic assignment',$5)",
      [employee, department, designation, date, actor],
    );
  await assignment('2020-01-01');
  await owner.query('UPDATE departments SET is_active=false WHERE id=$1', [department]);
  await assert.rejects(assignment('2021-01-01'), (e) => e.code === '23514');
  assert.equal(
    (
      await owner.query('SELECT count(*)::int n FROM employee_assignments WHERE employee_id=$1', [
        employee,
      ])
    ).rows[0].n,
    1,
  );
  ok('inactive department blocks new assignments and preserves existing history');
  await owner.query('UPDATE departments SET is_active=true');
  await owner.query('UPDATE designations SET is_active=false');
  await assert.rejects(assignment('2021-01-01'), (e) => e.code === '23514');
  ok('inactive designation blocks new assignments');
  const blocker = new Client({ connectionString: ownerUrl.href });
  await blocker.connect();
  try {
    await blocker.query('BEGIN');
    await blocker.query('UPDATE departments SET is_active=false WHERE id=$1', [department]);
    await owner.query("SET lock_timeout='200ms'");
    await assert.rejects(assignment('2021-01-01'), (e) => e.code === '55P03');
    ok('new assignment waits for concurrent department deactivation');
  } finally {
    await blocker.query('ROLLBACK');
    await blocker.end();
    await owner.query('RESET lock_timeout');
  }
  const snapshot = (
    await owner.query(
      "SELECT payload FROM audit_logs WHERE actor_id=$1 AND change_type='REFERENCE_UPDATE' ORDER BY id LIMIT 1",
      [actor],
    )
  ).rows[0].payload;
  assert.equal(snapshot.before.name, 'People Operations');
  assert.equal(snapshot.after.name, 'People Services');
  ok('actor-attributed audit preserves before and after');
  const before = (await owner.query('SELECT version FROM departments WHERE id=$1', [department]))
    .rows[0].version;
  await owner.query(`CREATE FUNCTION fail_reference_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.change_type='REFERENCE_UPDATE' THEN RAISE EXCEPTION 'Synthetic audit failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER fail_reference_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fail_reference_audit()`);
  await assert.rejects(
    service.change(hr.token, hr.csrf, 'departments', department, {
      name: 'Must roll back',
      isActive: true,
      expectedVersion: before,
    }),
  );
  assert.equal(
    (await owner.query('SELECT version FROM departments WHERE id=$1', [department])).rows[0]
      .version,
    before,
  );
  ok('audit failure rolls back reference change and version');
  console.log(`${passed} real PostgreSQL reference checks passed`);
} finally {
  await pool?.end();
  await owner?.end();
  if (created) await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
  await admin.end();
}
