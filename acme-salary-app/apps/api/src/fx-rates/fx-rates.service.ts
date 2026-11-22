import {HttpException} from '@nestjs/common';
import type {Pool,PoolClient} from 'pg';
import {z} from 'zod';
import {AuthenticationService} from '../auth/authentication.service.js';
import {dateOrdinal,resolveFx,convertExact,type FxRate} from '../common/domain/money.js';

const code=z.string().regex(/^[A-Z]{3}$/);
export const fxDate=z.string().refine(value=>{try{dateOrdinal(value);return value>='0001-01-01';}catch{return false;}},'Use a valid YYYY-MM-DD date');
export const fxInput=z.object({base:code,quote:code,effectiveDate:fxDate,
  rate:z.string().regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,8})?$/).refine(value=>/[1-9]/.test(value),'Rate must be positive'),
  source:z.string().trim().min(1).max(500),reason:z.string().trim().min(1).max(2000),expectedRevision:z.number().int().min(0)
}).strict().refine(value=>value.base!==value.quote,'Currencies must differ');
export const fxQuery=z.object({base:code.optional(),quote:code.optional(),asOf:fxDate.optional(),offset:z.coerce.number().int().min(0).max(100000).default(0)}).strict();
export const fxResolve=z.object({base:code,quote:code,asOf:fxDate}).strict();
const columns='id,base_currency,quote_currency,effective_date::text,revision,rate::text,source,reason,created_by,recorded_at';
export class FxRatesService{
  constructor(private readonly pool:Pool,private readonly auth:AuthenticationService,private readonly staleDays=7){}
  private async run<T>(token:string,csrf:string|undefined,work:(client:PoolClient,actor:string)=>Promise<T>){
    const client=await this.pool.connect();
    try{
      await client.query('BEGIN');if(csrf!==undefined&&!csrf)throw new HttpException('CSRF token required',403);
      const user=await this.auth.authenticateWithin(client,token,csrf);
      if(!user)throw new HttpException(csrf===undefined?'Sign in required':'Request rejected',csrf===undefined?401:403);
      if(!user.isHrManager&&(csrf!==undefined||!user.permissions.includes('read')))throw new HttpException('Insufficient FX permissions',403);
      const result=await work(client,user.id);await client.query('COMMIT');return result;
    }catch(error){await client.query('ROLLBACK');const code=(error as {code?:string}).code;
      if(code==='40001'||code==='23505')throw new HttpException('FX revision changed; refresh the history before resubmitting',409);
      if(code==='23514'||code==='23503')throw new HttpException('FX reference unavailable or rate invalid',409);
      throw error;
    }finally{client.release();}
  }
  list(token:string,input:z.infer<typeof fxQuery>){const q=fxQuery.parse(input);
    return this.run(token,undefined,async client=>{
      const values=[q.base??null,q.quote??null,q.asOf??null];
      const filter='($1::text IS NULL OR base_currency=$1) AND ($2::text IS NULL OR quote_currency=$2) AND ($3::date IS NULL OR effective_date<=$3)';
      return {items:(await client.query(`SELECT ${columns} FROM fx_rate_revisions WHERE ${filter} ORDER BY effective_date DESC,base_currency,quote_currency,revision DESC,id LIMIT 20 OFFSET $4`,[...values,q.offset])).rows,
        total:(await client.query(`SELECT count(*)::int n FROM fx_rate_revisions WHERE ${filter}`,values)).rows[0].n as number};
    });
  }
  append(token:string,csrf:string,input:z.infer<typeof fxInput>){const d=fxInput.parse(input);
    return this.run(token,csrf,async(client,actor)=>{
      const active=await client.query('SELECT code FROM currencies WHERE code=ANY($1::text[]) AND is_active ORDER BY code FOR SHARE',[[d.base,d.quote]]);
      if(active.rowCount!==2)throw new HttpException('Both currencies must be active',409);
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[`${d.base}:${d.quote}:${d.effectiveDate}`]);
      const current=(await client.query('SELECT coalesce(max(revision),0)::int n FROM fx_rate_revisions WHERE base_currency=$1 AND quote_currency=$2 AND effective_date=$3',[d.base,d.quote,d.effectiveDate])).rows[0].n as number;
      if(current!==d.expectedRevision)throw new HttpException('FX revision changed; refresh the history before resubmitting',409);
      return (await client.query(`INSERT INTO fx_rate_revisions(base_currency,quote_currency,effective_date,revision,rate,source,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${columns}`,
        [d.base,d.quote,d.effectiveDate,current+1,d.rate,d.source,d.reason,actor])).rows[0];
    });
  }
  resolve(token:string,input:z.infer<typeof fxResolve>){const q=fxResolve.parse(input);
    return this.run(token,undefined,async client=>{
      const codes=[...new Set([q.base,q.quote])];
      if((await client.query('SELECT code FROM currencies WHERE code=ANY($1::text[])',[codes])).rowCount!==codes.length)throw new HttpException('Unknown configured currency',422);
      const rates=(await client.query<FxRate>(`SELECT DISTINCT ON(base_currency,quote_currency) id,base_currency AS base,quote_currency AS quote,effective_date::text AS "effectiveDate",revision,rate::text,source
        FROM fx_rate_revisions WHERE effective_date<=$1::date AND effective_date>=$1::date-$2::int
        ORDER BY base_currency,quote_currency,effective_date DESC,revision DESC`,[q.asOf,this.staleDays])).rows;
      try{const path=resolveFx(rates,q.base,q.quote,q.asOf,this.staleDays);return {...q,maxStalenessDays:this.staleDays,rate:convertExact('1',path),path};}
      catch(error){if(error instanceof Error&&error.message==='FX_RATE_UNAVAILABLE')throw new HttpException('No eligible historical FX path within the staleness limit',422);throw error;}
    });
  }
}
