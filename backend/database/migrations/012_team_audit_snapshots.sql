CREATE OR REPLACE FUNCTION audit_team_identity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid;
BEGIN
  actor := nullif(current_setting('acme.team_actor',true),'')::uuid;
  IF actor IS NOT NULL THEN
    INSERT INTO audit_logs(actor_id,entity_type,entity_id,change_type,description,payload)
      VALUES(actor,'USER',NEW.id::text,CASE WHEN TG_OP='INSERT' THEN 'TEAM_INVITED' ELSE 'TEAM_UPDATED' END,
        'HR team management action',jsonb_build_object('before',CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,'after',to_jsonb(NEW)));
  END IF;
  RETURN NEW;
END;
$$;
