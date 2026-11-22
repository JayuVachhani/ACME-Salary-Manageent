import { randomUUID } from 'node:crypto';

/** Synthetic isolated-database setup; uses the same linkage and initial-approval guards as production. */
export async function linkFixtureActor(client, actorId) {
  const existing = (await client.query('SELECT employee_id FROM users WHERE id=$1', [actorId]))
    .rows[0]?.employee_id;
  if (existing) return existing;
  const administrator = randomUUID();
  const employee = randomUUID();
  await client.query(
    "INSERT INTO users(id,email,full_name,status,is_hr_manager) VALUES($1,$2,'Synthetic fixture administrator','ACTIVE',true)",
    [administrator, `${administrator}@acme.test`],
  );
  await client.query(
    "INSERT INTO employees(id,employee_code,email,first_name,last_name,joining_date,created_by) VALUES($1,$2,$3,'Synthetic','Actor','2020-01-01',$4)",
    [employee, `FIX-${employee.toUpperCase()}`, `${employee}@acme.test`, administrator],
  );
  await client.query('BEGIN');
  try {
    await client.query(
      "SELECT set_config('acme.link_actor',$1,true),set_config('acme.link_reason','Synthetic fixture linkage',true),set_config('acme.link_confirmed','true',true)",
      [administrator],
    );
    await client.query('UPDATE users SET employee_id=$1 WHERE id=$2', [employee, actorId]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
  return employee;
}

export async function approvedInitialFixture(
  client,
  { employeeId, actorId, amount, currency, effectiveFrom, countryCode },
) {
  await linkFixtureActor(client, actorId);
  const approver = randomUUID();
  await client.query(
    "INSERT INTO users(id,email,full_name,status,is_hr_manager) VALUES($1,$2,'Synthetic initial approver','ACTIVE',true)",
    [approver, `${approver}@acme.test`],
  );
  await linkFixtureActor(client, approver);
  const requestId = randomUUID();
  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO salary_change_requests(id,employee_id,requested_by,submitted_business_date,effective_from,expected_employee_version,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,reason,conversion_meta,request_kind)
      SELECT $1,e.id,$3,(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date,$4,e.version,$5,$6,c.country_code,c.default_currency,c.version,c.decimal_places,c.rounding_mode,'Synthetic initial salary','{}','INITIAL' FROM employees e CROSS JOIN country_rules c WHERE e.id=$2 AND c.country_code=$7`,
      [requestId, employeeId, actorId, effectiveFrom, amount, currency, countryCode],
    );
    await client.query(
      "INSERT INTO salary_approval_decisions(request_id,decision,decided_by,comment) VALUES($1,'APPROVED',$2,'Synthetic independent initial approval')",
      [requestId, approver],
    );
    const result = await client.query(
      `INSERT INTO salary_records(employee_id,approval_request_id,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,approval_status,change_reason,conversion_meta,created_by)
      SELECT employee_id,id,monthly_amount,currency,country_code,default_currency,country_rule_version,decimal_places,rounding_mode,effective_from,submitted_business_date,'ACTIVE',reason,conversion_meta,requested_by FROM salary_change_requests WHERE id=$1 RETURNING id`,
      [requestId],
    );
    await client.query('COMMIT');
    return result.rows[0].id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
