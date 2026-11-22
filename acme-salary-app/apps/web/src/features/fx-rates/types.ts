export type Rate = {
  id: string;
  base_currency: string;
  quote_currency: string;
  effective_date: string;
  revision: number;
  rate: string;
  source: string;
  reason: string;
  created_by: string;
  recorded_at: string;
};
export type RateDraft = {
  base: string;
  quote: string;
  effectiveDate: string;
  rate: string;
  source: string;
  reason: string;
};
export type FxQuery = { base: string; quote: string; asOf: string };
export type PendingRate = { input: RateDraft; expectedRevision: number };
export type Resolution = {
  rate: string;
  maxStalenessDays: number;
  path: {
    inverse: boolean;
    rate: {
      id: string;
      base: string;
      quote: string;
      rate: string;
      effectiveDate: string;
      revision: number;
      source: string;
    };
  }[];
};
