CREATE FUNCTION record_salary_history() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous salary_records%ROWTYPE; event_type text;
BEGIN
  SELECT s.* INTO previous FROM salary_records s
  WHERE s.employee_id=NEW.employee_id AND s.id<>NEW.id AND s.effective_from<=NEW.effective_from
    AND NOT EXISTS(SELECT 1 FROM salary_records c WHERE c.corrects_id=s.id AND c.id<>NEW.id)
  ORDER BY s.effective_from DESC,s.created_at DESC,s.id LIMIT 1;
  event_type := CASE WHEN NEW.corrects_id IS NOT NULL THEN 'TYPO_CORRECTION'
    WHEN previous.id IS NULL THEN 'INITIAL'
    WHEN previous.country_code<>NEW.country_code THEN 'COUNTRY_TRANSFER'
    ELSE 'REVISION' END;
  INSERT INTO salary_history_events(employee_id,salary_record_id,change_type,description,before_state,after_state,updated_by)
  VALUES(NEW.employee_id,NEW.id,event_type,NEW.change_reason,
    CASE WHEN previous.id IS NOT NULL THEN to_jsonb(previous) END,to_jsonb(NEW),NEW.created_by);
  IF previous.id IS NOT NULL AND previous.currency<>NEW.currency THEN
    INSERT INTO salary_history_events(employee_id,salary_record_id,change_type,description,before_state,after_state,updated_by)
    VALUES(NEW.employee_id,NEW.id,'CURRENCY_CHANGE',NEW.change_reason,to_jsonb(previous),to_jsonb(NEW),NEW.created_by);
  END IF;
  INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
  VALUES(NEW.created_by,'SALARY',NEW.id::text,event_type,NEW.change_reason,
    jsonb_build_object('before',CASE WHEN previous.id IS NOT NULL THEN to_jsonb(previous) END,'after',to_jsonb(NEW)));
  UPDATE employees SET version=version+1,updated_at=now() WHERE id=NEW.employee_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER salary_history_atomic AFTER INSERT ON salary_records
FOR EACH ROW EXECUTE FUNCTION record_salary_history();
REVOKE ALL ON FUNCTION record_salary_history() FROM PUBLIC;
