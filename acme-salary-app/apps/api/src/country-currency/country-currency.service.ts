import { HttpException } from '@nestjs/common';
import type {Pool,PoolClient} from 'pg';
import {z} from 'zod';
import {AuthenticationService} from '../auth/authentication.service.js';

export const countryCode=z.string().regex(/^[A-Z]{2}$/);
export const currencyCode=z.string().regex(/^[A-Z]{3}$/);
export const countryInput=z.object({countryCode,countryName:z.string().trim().min(1).max(200),defaultCurrency:currencyCode,
  decimalPlaces:z.number().int().min(0).max(4),roundingMode:z.enum(['HALF_UP','FLOOR','CEIL']),
  regulatoryNotes:z.string().trim().max(4000),retentionNotes:z.string().trim().max(4000)}).strict();
export const countryChange=countryInput.omit({countryCode:true}).extend({isActive:z.boolean(),expectedVersion:z.number().int().positive()}).strict();
export const currencyChange=z.object({isActive:z.boolean(),expectedVersion:z.number().int().min(0)}).strict();
const countryColumns=`country_code,country_name,default_currency,decimal_places,rounding_mode,is_active,version,
  regulations_meta->>'notes' AS regulatory_notes,retention_policy->>'notes' AS retention_notes,updated_at`;

export class CountryCurrencyService {
  constructor(private readonly pool:Pool,private readonly auth:AuthenticationService){}
  private async requireDefault(client:PoolClient,code:string){
    const valid=await client.query(`SELECT r.code FROM currencies r JOIN currency_catalogue c USING(code)
      WHERE r.code=$1 AND r.is_active AND c.minor_units IS NOT NULL AND c.minor_units=r.minor_units FOR SHARE OF r`,[code]);
    if(!valid.rowCount)throw new HttpException('Reference unavailable: select an active supported catalogue currency',409);
  }
  private async run<T>(token:string,csrf:string|undefined,hrOnly:boolean,work:(client:PoolClient,actor:string)=>Promise<T>){
    const client=await this.pool.connect();
    try{
      await client.query('BEGIN');
      if(csrf!==undefined&&!csrf)throw new HttpException('CSRF token required',403);
      const user=await this.auth.authenticateWithin(client,token,csrf);
      if(!user)throw new HttpException(csrf===undefined?'Sign in required':'Request rejected',csrf===undefined?401:403);
      if(!user.isHrManager&&(hrOnly||!user.permissions.includes('read')))throw new HttpException(hrOnly?'HR Manager access required':'Read permission required',403);
      if(csrf!==undefined)await client.query("SELECT set_config('acme.reference_actor',$1,true)",[user.id]);
      const result=await work(client,user.id);await client.query('COMMIT');return result;
    }catch(error){
      await client.query('ROLLBACK');const code=(error as {code?:string}).code;
      if(code==='23505')throw new HttpException('Country code or name already exists',409);
      if(code==='23514'||code==='23503')throw new HttpException('Reference unavailable or configuration conflicts with protected records',409);
      throw error;
    }finally{client.release();}
  }
  catalogue(token:string){
    return this.run(token,undefined,false,async client=>({items:(await client.query(`SELECT c.code,c.currency_name,c.minor_units,c.published_on::text,c.source,
      coalesce(r.is_active,false) AS is_active,coalesce(r.version,0) AS version,
      (c.minor_units IS NOT NULL AND (r.code IS NULL OR c.minor_units=r.minor_units)) AS supported,
      r.minor_units AS configured_minor_units FROM currency_catalogue c LEFT JOIN currencies r USING(code) ORDER BY c.code`)).rows}));
  }
  currencies(token:string){return this.run(token,undefined,true,async client=>({items:(await client.query('SELECT code,minor_units,is_active,version FROM currencies ORDER BY code')).rows}));}
  activate(token:string,csrf:string,code:string,input:z.infer<typeof currencyChange>){
    currencyCode.parse(code);const details=currencyChange.parse(input);
    return this.run(token,csrf,true,async client=>{
      const entry=(await client.query('SELECT minor_units FROM currency_catalogue WHERE code=$1',[code])).rows[0];
      if(details.isActive&&(!entry||entry.minor_units===null))throw new HttpException('Catalogue entry is unavailable for salary use',409);
      let result;
      if(details.expectedVersion===0){
        if(!details.isActive)throw new HttpException('Currency is not configured; refresh the catalogue',409);
        result=await client.query(`INSERT INTO currencies(code,minor_units,is_active) VALUES($1,$2,true) ON CONFLICT DO NOTHING RETURNING code,minor_units,is_active,version`,[code,entry.minor_units]);
      }else result=await client.query(`UPDATE currencies SET is_active=$2 WHERE code=$1 AND version=$3 AND (NOT $2 OR minor_units=$4) RETURNING code,minor_units,is_active,version`,[code,details.isActive,details.expectedVersion,entry?.minor_units??null]);
      if(!result.rowCount)throw new HttpException('Currency changed or precision differs from catalogue; refresh and review',409);
      return result.rows[0];
    });
  }
  countries(token:string,offset=0){return this.run(token,undefined,true,async client=>({
    items:(await client.query(`SELECT ${countryColumns} FROM country_rules ORDER BY country_name,country_code LIMIT 20 OFFSET $1`,[offset])).rows,
    total:(await client.query('SELECT count(*)::int n FROM country_rules')).rows[0].n as number
  }));}
  create(token:string,csrf:string,input:z.infer<typeof countryInput>){
    const d=countryInput.parse(input);
    return this.run(token,csrf,true,async(client,actor)=>{await this.requireDefault(client,d.defaultCurrency);return (await client.query(`INSERT INTO country_rules(country_code,country_name,default_currency,decimal_places,rounding_mode,regulations_meta,retention_policy,updated_by)
      VALUES($1,$2,$3,$4,$5,jsonb_build_object('notes',$6::text),jsonb_build_object('mode','KEEP_UNTIL_REMOVED','notes',$7::text),$8) RETURNING ${countryColumns}`,
      [d.countryCode,d.countryName,d.defaultCurrency,d.decimalPlaces,d.roundingMode,d.regulatoryNotes,d.retentionNotes,actor])).rows[0];});
  }
  change(token:string,csrf:string,code:string,input:z.infer<typeof countryChange>){
    countryCode.parse(code);const d=countryChange.parse(input);
    return this.run(token,csrf,true,async(client,actor)=>{
      if(d.isActive)await this.requireDefault(client,d.defaultCurrency);
      const result=await client.query(`UPDATE country_rules SET country_name=$2,default_currency=$3,decimal_places=$4,rounding_mode=$5,
        regulations_meta=regulations_meta||jsonb_build_object('notes',$6::text),retention_policy=retention_policy||jsonb_build_object('notes',$7::text),
        is_active=$8,updated_by=$9 WHERE country_code=$1 AND version=$10 RETURNING ${countryColumns}`,
        [code,d.countryName,d.defaultCurrency,d.decimalPlaces,d.roundingMode,d.regulatoryNotes,d.retentionNotes,d.isActive,actor,d.expectedVersion]);
      if(!result.rowCount)throw new HttpException('Country changed or is unavailable; refresh before retrying',409);
      return result.rows[0];
    });
  }
}
