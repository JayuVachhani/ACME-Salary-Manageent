CREATE FUNCTION guard_currency_configuration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate currencies instead' USING ERRCODE='55000'; END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.code<>OLD.code THEN RAISE EXCEPTION 'Currency code is immutable' USING ERRCODE='55000'; END IF;
    IF NEW.minor_units<>OLD.minor_units AND (
      EXISTS(SELECT 1 FROM country_rules WHERE default_currency=OLD.code) OR
      EXISTS(SELECT 1 FROM salary_records WHERE currency=OLD.code OR default_currency=OLD.code) OR
      EXISTS(SELECT 1 FROM salary_change_requests WHERE currency=OLD.code OR default_currency=OLD.code) OR
      EXISTS(SELECT 1 FROM fx_rate_revisions WHERE base_currency=OLD.code OR quote_currency=OLD.code) OR
      EXISTS(SELECT 1 FROM report_snapshots WHERE target_currency=OLD.code)
    ) THEN RAISE EXCEPTION 'Referenced currency precision cannot change' USING ERRCODE='23514'; END IF;
    NEW.version:=OLD.version+1;
  ELSE NEW.version:=1;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER currency_config_guard BEFORE INSERT OR UPDATE OR DELETE ON currencies FOR EACH ROW EXECUTE FUNCTION guard_currency_configuration();
CREATE TRIGGER currency_no_truncate BEFORE TRUNCATE ON currencies FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

CREATE FUNCTION guard_country_configuration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Deactivate countries instead' USING ERRCODE='55000'; END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.country_code<>OLD.country_code THEN RAISE EXCEPTION 'Country code is immutable' USING ERRCODE='55000'; END IF;
    NEW.version:=OLD.version+1;
  ELSE NEW.version:=1;
  END IF;
  IF NEW.country_name<>btrim(NEW.country_name) OR length(NEW.country_name) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid country name' USING ERRCODE='23514';
  END IF;
  -- Deactivation may preserve an inactive default; activation/configuration requires an active currency.
  IF NEW.is_active THEN
    PERFORM 1 FROM currencies WHERE code=NEW.default_currency AND is_active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Active default currency required' USING ERRCODE='23514'; END IF;
  END IF;
  NEW.updated_at:=clock_timestamp();
  RETURN NEW;
END $$;
CREATE TRIGGER country_config_guard BEFORE INSERT OR UPDATE OR DELETE ON country_rules FOR EACH ROW EXECUTE FUNCTION guard_country_configuration();
CREATE TRIGGER country_no_truncate BEFORE TRUNCATE ON country_rules FOR EACH STATEMENT EXECUTE FUNCTION block_immutable_change();

CREATE FUNCTION audit_country_currency_configuration() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid; entity text;
BEGIN
  actor:=nullif(current_setting('acme.reference_actor',true),'')::uuid;
  IF actor IS NOT NULL THEN
    entity:=to_jsonb(NEW)->>CASE WHEN TG_TABLE_NAME='currencies' THEN 'code' ELSE 'country_code' END;
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
    VALUES(actor,upper(TG_TABLE_NAME),entity,'CONFIG_'||TG_OP,'Country/currency administration',
      jsonb_build_object('before',CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,'after',to_jsonb(NEW)));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER country_configuration_audit AFTER INSERT OR UPDATE ON country_rules FOR EACH ROW EXECUTE FUNCTION audit_country_currency_configuration();
CREATE TRIGGER currency_configuration_audit AFTER INSERT OR UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION audit_country_currency_configuration();

CREATE FUNCTION validate_new_financial_references() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE country text; codes text[]; code text;
BEGIN
  IF TG_TABLE_NAME='fx_rate_revisions' THEN codes:=ARRAY[NEW.base_currency,NEW.quote_currency];
  ELSIF TG_TABLE_NAME='report_snapshots' THEN codes:=ARRAY[NEW.target_currency];
  ELSE
    country:=NEW.country_code;
    PERFORM 1 FROM country_rules WHERE country_code=country AND is_active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Active country required' USING ERRCODE='23514'; END IF;
    IF TG_TABLE_NAME='employee_assignments' THEN
      SELECT ARRAY[default_currency] INTO codes FROM country_rules WHERE country_code=country;
    ELSE codes:=ARRAY[NEW.currency,NEW.default_currency]; END IF;
  END IF;
  -- Stable order for cross-currency rows; shared locks conflict with status/precision changes.
  FOR code IN SELECT DISTINCT unnest(codes) ORDER BY 1 LOOP
    PERFORM 1 FROM currencies c WHERE c.code=code AND is_active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Active currency required' USING ERRCODE='23514'; END IF;
  END LOOP;
  RETURN NEW;
END $$;
DO $$ DECLARE target text; BEGIN
  FOREACH target IN ARRAY ARRAY['employee_assignments','salary_change_requests','salary_records','fx_rate_revisions','report_snapshots'] LOOP
    EXECUTE format('CREATE TRIGGER active_financial_reference BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION validate_new_financial_references()',target);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION guard_currency_configuration(),guard_country_configuration(),audit_country_currency_configuration(),validate_new_financial_references() FROM PUBLIC;
