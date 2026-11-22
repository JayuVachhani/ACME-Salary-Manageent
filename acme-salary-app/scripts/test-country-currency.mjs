import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Client, Pool } from 'pg';
import { AuthenticationService } from '../apps/api/dist/auth/authentication.service.js';
import { CountryCurrencyService } from '../apps/api/dist/country-currency/country-currency.service.js';
const name = `acme_test_${randomUUID().replaceAll('-', '')}`;
const ownerUrl = new URL(process.env.MIGRATION_DATABASE_URL),
  runtimeUrl = new URL(process.env.DATABASE_URL);
const admin = new Client({ connectionString: ownerUrl.href });
await admin.connect();
let created = false,
  owner,
  pool,
  passed = 0;
const ok = (label) => console.log(`PASS CTRY-DB-${String(++passed).padStart(2, '0')} ${label}`);
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
  await owner.query('UPDATE users SET permissions=ARRAY[]::text[] WHERE id=$1', [reader]);
  const auth = new AuthenticationService(
      pool,
      'synthetic-country-test-secret-at-least-32-characters',
    ),
    service = new CountryCurrencyService(pool, auth);
  const login = async (email) => {
    const issued = await auth.issue(email);
    return auth.verify(issued.challengeId, issued.code);
  };
  const hr = await login('reference.hr@acme.test'),
    member = await login('reference.reader@acme.test');
  await denied(service.catalogue(''), 401);
  await denied(service.catalogue(member.token), 403);
  ok('anonymous and member without read denied');
  await owner.query("UPDATE users SET permissions=ARRAY['read'] WHERE id=$1", [reader]);
  const catalogue = await service.catalogue(member.token);
  assert.equal(catalogue.items.length, 178);
  assert.equal(catalogue.items.find((c) => c.code === 'USD').minor_units, 2);
  assert.equal(catalogue.items.find((c) => c.code === 'XAU').minor_units, null);
  ok('read member sees pinned full catalogue including N.A.');
  const pinned = JSON.parse(readFileSync('database/reference/iso4217.json', 'utf8'));
  assert.deepEqual(
    catalogue.items.map((row) => ({
      code: row.code,
      name: row.currency_name,
      minorUnits: row.minor_units,
    })),
    pinned.currencies,
  );
  assert.ok(
    catalogue.items.every(
      (row) => row.published_on === pinned.published && row.source === pinned.source,
    ),
  );
  ok('all catalogue codes, names, precision and provenance match pinned source');
  await denied(service.countries(member.token), 403);
  await denied(
    service.activate(member.token, member.csrf, 'USD', { isActive: true, expectedVersion: 0 }),
    403,
  );
  ok('non-HR country and currency mutations denied');
  await denied(service.activate(hr.token, '', 'USD', { isActive: true, expectedVersion: 0 }), 403);
  await denied(
    service.activate(hr.token, 'wrong', 'USD', { isActive: true, expectedVersion: 0 }),
    403,
  );
  ok('missing and invalid CSRF denied');
  await denied(
    service.activate(hr.token, hr.csrf, 'XAU', { isActive: true, expectedVersion: 0 }),
    409,
  );
  ok('N.A. entry cannot be activated');
  const usd = await service.activate(hr.token, hr.csrf, 'USD', {
    isActive: true,
    expectedVersion: 0,
  });
  assert.equal(usd.version, 1);
  ok('HR activates numeric catalogue entry');
  await denied(
    service.activate(hr.token, hr.csrf, 'USD', { isActive: true, expectedVersion: 0 }),
    409,
  );
  ok('duplicate activation and stale version conflict');
  const data = {
    countryCode: 'ZZ',
    countryName: '  Synthetic Country  ',
    defaultCurrency: 'USD',
    decimalPlaces: 2,
    roundingMode: 'HALF_UP',
    regulatoryNotes: 'Synthetic regulation',
    retentionNotes: 'Synthetic retention',
  };
  await owner.query("INSERT INTO currencies(code,minor_units) VALUES('XYZ',2)");
  await denied(service.create(hr.token, hr.csrf, { ...data, defaultCurrency: 'XYZ' }), 409);
  ok('crafted unknown legacy currency cannot become a new active country default');
  const country = await service.create(hr.token, hr.csrf, data);
  assert.equal(country.country_name, 'Synthetic Country');
  assert.equal(country.version, 1);
  ok('country created with trimmed name and explicit policy');
  await denied(service.create(hr.token, hr.csrf, data), 409);
  ok('duplicate country rejected');
  await assert.rejects(
    owner.query("UPDATE currencies SET minor_units=3 WHERE code='USD'"),
    (e) => e.code === '23514',
  );
  ok('referenced currency precision protected through SQL');
  await assert.rejects(
    owner.query("UPDATE country_rules SET country_code='ZY' WHERE country_code='ZZ'"),
    (e) => e.code === '55000',
  );
  await assert.rejects(
    owner.query("UPDATE currencies SET code='USX' WHERE code='USD'"),
    (e) => e.code === '55000',
  );
  ok('country and currency codes immutable');
  for (const table of ['currencies', 'country_rules']) {
    await assert.rejects(owner.query(`DELETE FROM ${table}`), (e) => e.code === '55000');
    await assert.rejects(owner.query(`TRUNCATE ${table} CASCADE`), (e) => e.code === '55000');
  }
  ok('delete and truncate blocked');
  const { countryCode, ...fields } = data;
  assert.equal(countryCode, 'ZZ');
  const edit = {
    ...fields,
    isActive: true,
    expectedVersion: 1,
    decimalPlaces: 3,
    roundingMode: 'FLOOR',
  };
  const edited = await service.change(hr.token, hr.csrf, 'ZZ', edit);
  assert.equal(edited.version, 2);
  assert.equal(edited.decimal_places, 3);
  await denied(service.change(hr.token, hr.csrf, 'ZZ', edit), 409);
  ok('country edit advances version and rejects stale update');
  await owner.query(
    "UPDATE country_rules SET regulations_meta=regulations_meta||jsonb_build_object('existing',true),retention_policy=retention_policy||jsonb_build_object('existing',true) WHERE country_code='ZZ'",
  );
  let v = (await owner.query("SELECT version FROM country_rules WHERE country_code='ZZ'")).rows[0]
    .version;
  await service.change(hr.token, hr.csrf, 'ZZ', { ...edit, expectedVersion: v });
  const preserved = (
    await owner.query(
      "SELECT regulations_meta,retention_policy FROM country_rules WHERE country_code='ZZ'",
    )
  ).rows[0];
  assert.equal(preserved.regulations_meta.existing, true);
  assert.equal(preserved.retention_policy.existing, true);
  ok('editing notes preserves existing policy metadata');
  const emp = randomUUID(),
    dept = randomUUID(),
    designation = randomUUID();
  await owner.query(
    "INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,'SYN-COUNTRY','country.employee@acme.test','Synthetic','Employee','2020-01-01',$2)",
    [emp, actor],
  );
  await owner.query("INSERT INTO departments(id,name) VALUES($1,'Synthetic Country Department')", [
    dept,
  ]);
  await owner.query(
    "INSERT INTO designations(id,name) VALUES($1,'Synthetic Country Designation')",
    [designation],
  );
  const assignment = (date) =>
    owner.query(
      "INSERT INTO employee_assignments(employee_id,country_code,department_id,designation_id,employment_status,effective_from,reason,created_by) VALUES($1,'ZZ',$2,$3,'ACTIVE',$4,'Synthetic test',$5)",
      [emp, dept, designation, date, actor],
    );
  await assignment('2020-01-01');
  const policy = (
    await owner.query(
      "SELECT version,decimal_places,rounding_mode FROM country_rules WHERE country_code='ZZ'",
    )
  ).rows[0];
  const ledger = (
    await owner.query(
      `INSERT INTO salary_records(employee_id,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,approval_status,change_reason,created_by)
    VALUES($1,1000,'USD','ZZ','USD',$2,$3,$4,'2020-01-01','2020-01-01','ACTIVE','Synthetic initial salary',$5) RETURNING id`,
      [emp, policy.version, policy.decimal_places, policy.rounding_mode, actor],
    )
  ).rows[0].id;
  const original = (
    await owner.query('SELECT to_jsonb(s) AS snapshot FROM salary_records s WHERE id=$1', [ledger])
  ).rows[0].snapshot;

  await service.activate(hr.token, hr.csrf, 'USD', { isActive: false, expectedVersion: 1 });
  await assert.rejects(assignment('2021-01-01'), (e) => e.code === '23514');
  ok('inactive currency blocks new assignments');
  v = (await owner.query("SELECT version FROM country_rules WHERE country_code='ZZ'")).rows[0]
    .version;
  await service.change(hr.token, hr.csrf, 'ZZ', { ...edit, isActive: false, expectedVersion: v });
  assert.equal(
    (
      await owner.query('SELECT count(*)::int n FROM employee_assignments WHERE employee_id=$1', [
        emp,
      ])
    ).rows[0].n,
    1,
  );
  ok('deactivation with inactive currency preserves existing assignment');
  v++;
  await denied(
    service.change(hr.token, hr.csrf, 'ZZ', { ...edit, isActive: true, expectedVersion: v }),
    409,
  );
  ok('country reactivation requires active default currency');
  await service.activate(hr.token, hr.csrf, 'USD', { isActive: true, expectedVersion: 2 });
  await assert.rejects(assignment('2021-01-01'), (e) => e.code === '23514');
  ok('inactive country blocks new assignment even with active currency');
  await service.change(hr.token, hr.csrf, 'ZZ', { ...edit, isActive: true, expectedVersion: v });
  await assignment('2021-01-01');
  ok('reactivation retains identifiers and restores new assignment eligibility');
  const rival = new Client({ connectionString: ownerUrl.href });
  await rival.connect();
  try {
    await rival.query('BEGIN');
    await rival.query("UPDATE currencies SET is_active=false WHERE code='USD'");
    await owner.query("SET lock_timeout='200ms'");
    await assert.rejects(assignment('2022-01-01'), (e) => e.code === '55P03');
    ok('new assignment waits on concurrent currency deactivation');
  } finally {
    await rival.query('ROLLBACK');
    await rival.end();
    await owner.query('RESET lock_timeout');
  }
  v = (await owner.query("SELECT version FROM country_rules WHERE country_code='ZZ'")).rows[0]
    .version;
  const outcomes = await Promise.allSettled(
    [2, 4].map((decimalPlaces) =>
      service.change(hr.token, hr.csrf, 'ZZ', { ...edit, decimalPlaces, expectedVersion: v }),
    ),
  );
  assert.equal(outcomes.filter((v) => v.status === 'fulfilled').length, 1);
  ok('concurrent country edits have exactly one winner');
  assert.deepEqual(
    (
      await owner.query('SELECT to_jsonb(s) AS snapshot FROM salary_records s WHERE id=$1', [
        ledger,
      ])
    ).rows[0].snapshot,
    original,
  );
  ok('country edits and lifecycle changes preserve exact historical salary snapshot');
  const audit = (
    await owner.query(
      "SELECT payload FROM audit_logs WHERE entity_type='COUNTRY_RULES' AND change_type='CONFIG_UPDATE' ORDER BY id LIMIT 1",
    )
  ).rows[0].payload;
  assert.equal(audit.before.decimal_places, 2);
  assert.equal(audit.after.decimal_places, 3);
  ok('before and after country policy audited');
  v = (await owner.query("SELECT version FROM country_rules WHERE country_code='ZZ'")).rows[0]
    .version;
  await owner.query(
    `CREATE FUNCTION fail_config_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.change_type='CONFIG_UPDATE' THEN RAISE EXCEPTION 'Synthetic audit failure'; END IF; RETURN NEW; END $$;CREATE TRIGGER fail_config_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fail_config_audit()`,
  );
  await assert.rejects(service.change(hr.token, hr.csrf, 'ZZ', { ...edit, expectedVersion: v }));
  assert.equal(
    (await owner.query("SELECT version FROM country_rules WHERE country_code='ZZ'")).rows[0]
      .version,
    v,
  );
  ok('audit failure rolls back policy and version');
  await assert.rejects(
    pool.query("UPDATE currency_catalogue SET minor_units=3 WHERE code='USD'"),
    (e) => e.code === '42501',
  );
  ok('runtime catalogue cannot be mutated');
  console.log(`${passed} real PostgreSQL country/currency checks passed`);
} finally {
  await pool?.end();
  await owner?.end();
  if (created) await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
  await admin.end();
}
