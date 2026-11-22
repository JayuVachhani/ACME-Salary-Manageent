-- New FX events include both revisions; never rewrite existing immutable audit rows.
CREATE OR REPLACE FUNCTION audit_fx_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous jsonb;
BEGIN
  SELECT to_jsonb(r) INTO previous FROM fx_rate_revisions r
  WHERE r.base_currency=NEW.base_currency AND r.quote_currency=NEW.quote_currency
    AND r.effective_date=NEW.effective_date AND r.revision<NEW.revision
  ORDER BY r.revision DESC LIMIT 1;
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
  VALUES(NEW.created_by,'FX_RATE',NEW.id::text,'REVISION',NEW.reason,
    jsonb_build_object('before',previous,'after',to_jsonb(NEW)));
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION audit_fx_revision() FROM PUBLIC;
