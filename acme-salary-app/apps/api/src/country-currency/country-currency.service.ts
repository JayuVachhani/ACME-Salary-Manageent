import { sqlState } from '../database/database-errors.js';
import { requiredRow } from '../database/query-result.js';
import type { CountryRecord, CurrencyResponse, CatalogueEntryResponse } from './dto/country-currency-response.dto.js';
import { withTransaction } from '../database/transaction.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { Inject, Injectable } from '@nestjs/common';
import { countryCode, currencyCode, countryInput, countryChange, currencyChange } from './dto/country-currency.dto.js';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
const countryColumns = `country_code,country_name,default_currency,decimal_places,rounding_mode,is_active,version,
 regulations_meta->>'notes' AS regulatory_notes,retention_policy->>'notes' AS retention_notes,updated_at`;
@Injectable()
export class CountryCurrencyService {
  constructor(
  @Inject(Pool) private readonly pool: Pool,
  @Inject(AuthenticationService) private readonly auth: AuthenticationService) { }
  private async requireDefault(client: PoolClient, code: string) {
    const valid = await client.query(`SELECT r.code FROM currencies r JOIN currency_catalogue c USING(code)
   WHERE r.code=$1 AND r.is_active AND c.minor_units IS NOT NULL AND c.minor_units=r.minor_units FOR SHARE OF r`, [code]);
    if (!valid.rowCount)
      throw new ApplicationError('Reference unavailable: select an active supported catalogue currency', 409);
  }
  private async run<T>(token: string, csrf: string | undefined, hrOnly: boolean, work: (client: PoolClient, actor: string) => Promise<T>) {
    try {
      return await withTransaction(this.pool, async client => {
        if (csrf !== undefined && !csrf)
          throw new ApplicationError('CSRF token required', 403);
        const user = await this.auth.authenticateWithin(client, token, csrf);
        if (!user)
          throw new ApplicationError(csrf === undefined ? 'Sign in required' : 'Request rejected', csrf === undefined ? 401 : 403);
        if (!user.isHrManager && (hrOnly || !user.permissions.includes('read')))
          throw new ApplicationError(hrOnly ? 'HR Manager access required' : 'Read permission required', 403);
        if (csrf !== undefined)
          await client.query("SELECT set_config('acme.reference_actor',$1,true)", [user.id]);
        const result = await work(client, user.id);
        return result;
      });
    }
    catch (error) {
      const code = sqlState(error);
      if (code === '23505')
        throw new ApplicationError('Country code or name already exists', 409);
      if (code === '23514' || code === '23503')
        throw new ApplicationError('Reference unavailable or configuration conflicts with protected records', 409);
      throw error;
    }

  }
  catalogue(token: string) {
    return this.run(token, undefined, false, async (client) => ({ items: (await client.query<CatalogueEntryResponse>(`SELECT c.code,c.currency_name,c.minor_units,c.published_on::text,c.source,
   coalesce(r.is_active,false) AS is_active,coalesce(r.version,0) AS version,
   (c.minor_units IS NOT NULL AND (r.code IS NULL OR c.minor_units=r.minor_units)) AS supported,
   r.minor_units AS configured_minor_units FROM currency_catalogue c LEFT JOIN currencies r USING(code) ORDER BY c.code`)).rows }));
  }
  currencies(token: string) { return this.run(token, undefined, true, async (client) => ({ items: (await client.query<CurrencyResponse>('SELECT code,minor_units,is_active,version FROM currencies ORDER BY code')).rows })); }
  activate(token: string, csrf: string, code: string, input: z.infer<typeof currencyChange>) {
    currencyCode.parse(code);
    const details = currencyChange.parse(input);
    return this.run(token, csrf, true, async (client) => {
      const entry = (await client.query<{ minor_units: number | null }>('SELECT minor_units FROM currency_catalogue WHERE code=$1', [code])).rows[0];
      if (details.isActive && (!entry || entry.minor_units === null))
        throw new ApplicationError('Catalogue entry is unavailable for salary use', 409);
      let result;
      if (details.expectedVersion === 0) {
        if (!details.isActive)
          throw new ApplicationError('Currency is not configured; refresh the catalogue', 409);
        result = await client.query<CurrencyResponse>(`INSERT INTO currencies(code,minor_units,is_active) VALUES($1,$2,true) ON CONFLICT DO NOTHING RETURNING code,minor_units,is_active,version`, [code, entry?.minor_units ?? null]);
      }
      else
        result = await client.query<CurrencyResponse>(`UPDATE currencies SET is_active=$2 WHERE code=$1 AND version=$3 AND (NOT $2 OR minor_units=$4) RETURNING code,minor_units,is_active,version`, [code, details.isActive, details.expectedVersion, entry?.minor_units ?? null]);
      if (!result.rowCount)
        throw new ApplicationError('Currency changed or precision differs from catalogue; refresh and review', 409);
      return requiredRow(result);
    });
  }
  countries(token: string, offset = 0) {
    return this.run(token, undefined, true, async (client) => ({
      items: (await client.query<CountryRecord>(`SELECT ${countryColumns} FROM country_rules ORDER BY country_name,country_code LIMIT 20 OFFSET $1`, [offset])).rows,
      total: requiredRow(await client.query<{ n: number }>('SELECT count(*)::int n FROM country_rules')).n
    }));
  }
  create(token: string, csrf: string, input: z.infer<typeof countryInput>) {
    const d = countryInput.parse(input);
    return this.run(token, csrf, true, async (client, actor) => {
      await this.requireDefault(client, d.defaultCurrency);
      return requiredRow(await client.query<CountryRecord>(`INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,regulations_meta,retention_policy,updated_by)
   VALUES($1,$2,$3,$4,$5,jsonb_build_object('notes',$6::text),jsonb_build_object('mode','KEEP_UNTIL_REMOVED','notes',$7::text),$8) RETURNING ${countryColumns}`, [d.countryCode, d.countryName, d.defaultCurrency, d.decimalPlaces, d.roundingMode, d.regulatoryNotes, d.retentionNotes, actor]));
    });
  }
  change(token: string, csrf: string, code: string, input: z.infer<typeof countryChange>) {
    countryCode.parse(code);
    const d = countryChange.parse(input);
    return this.run(token, csrf, true, async (client, actor) => {
      if (d.isActive)
        await this.requireDefault(client, d.defaultCurrency);
      const result = await client.query<CountryRecord>(`UPDATE country_rules SET country_name=$2,default_currency=$3,decimal_places=$4,rounding_mode=$5,
    regulations_meta=regulations_meta||jsonb_build_object('notes',$6::text),retention_policy=retention_policy||jsonb_build_object('notes',$7::text),
    is_active=$8,updated_by=$9 WHERE country_code=$1 AND version=$10 RETURNING ${countryColumns}`, [code, d.countryName, d.defaultCurrency, d.decimalPlaces, d.roundingMode, d.regulatoryNotes, d.retentionNotes, d.isActive, actor, d.expectedVersion]);
      if (!result.rowCount)
        throw new ApplicationError('Country changed or is unavailable; refresh before retrying', 409);
      return requiredRow(result);
    });
  }
}
