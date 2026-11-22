-- Forward fix: disambiguate the PL/pgSQL variable from the currencies.code column.
CREATE OR REPLACE FUNCTION validate_new_financial_references() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE country text; codes text[]; currency_code_value text;
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
  FOR currency_code_value IN SELECT DISTINCT unnest(codes) ORDER BY 1 LOOP
    PERFORM 1 FROM currencies c WHERE c.code=currency_code_value AND is_active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Active currency required' USING ERRCODE='23514'; END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION validate_new_financial_references() FROM PUBLIC;
