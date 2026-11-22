-- Match API whitespace/length checks without rewriting pre-existing reference names.
ALTER TABLE departments ADD CONSTRAINT department_name_bounds
  CHECK (length(name::text)<=200 AND name::text !~ '^[[:space:]]|[[:space:]]$');
ALTER TABLE designations ADD CONSTRAINT designation_name_bounds
  CHECK (length(name::text)<=200 AND name::text !~ '^[[:space:]]|[[:space:]]$');
