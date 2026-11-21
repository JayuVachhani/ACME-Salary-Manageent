CREATE FUNCTION revoke_disabled_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='DELETED' AND OLD.status<>'DELETED' THEN
    UPDATE user_sessions SET revoked_at=clock_timestamp() WHERE user_id=NEW.id AND revoked_at IS NULL;
    UPDATE login_challenges SET consumed_at=clock_timestamp() WHERE user_id=NEW.id AND consumed_at IS NULL;
    INSERT INTO audit_logs(entity_type,entity_id,change_type,description)
      VALUES('USER',NEW.id::text,'ACCESS_REVOKED','Sessions and open OTPs revoked on user removal');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER users_revoke_access AFTER UPDATE OF status ON users
FOR EACH ROW EXECUTE FUNCTION revoke_disabled_identity();
REVOKE ALL ON FUNCTION revoke_disabled_identity() FROM PUBLIC;
