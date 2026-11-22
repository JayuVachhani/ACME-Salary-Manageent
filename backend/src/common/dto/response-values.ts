import { z } from 'zod';
/** PostgreSQL timestamps arrive as Date objects; the public wire contract remains ISO text. */
export const timestampText = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.string(),
);
