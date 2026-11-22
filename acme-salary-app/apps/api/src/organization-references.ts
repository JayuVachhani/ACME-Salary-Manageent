import { HttpException } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from './authentication.js';

export const referenceKind=z.enum(['departments','designations']);
export type ReferenceKind=z.infer<typeof referenceKind>;
export const referenceCreate=z.object({name:z.string().trim().min(1).max(200)}).strict();
export const referenceChange=referenceCreate.extend({isActive:z.boolean(),expectedVersion:z.number().int().positive()}).strict();
export class OrganizationReferencesService {
  constructor(private readonly pool:Pool,private readonly auth:AuthenticationService) {}
  private async run<T>(token:string,csrf:string|undefined,work:(client:PoolClient)=>Promise<T>) {
    const client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      if(csrf!==undefined&&!csrf)throw new HttpException('CSRF token required',403);
      const user=await this.auth.authenticateWithin(client,token,csrf);
      if(!user)throw new HttpException(csrf===undefined?'Sign in required':'Request rejected',csrf===undefined?401:403);
      if(!user.isHrManager)throw new HttpException('HR Manager access required',403);
      await client.query("SELECT set_config('acme.reference_actor',$1,true)",[user.id]);
      const result=await work(client);await client.query('COMMIT');return result;
    } catch(error) {
      await client.query('ROLLBACK');
      if((error as {code?:string}).code==='23505')throw new HttpException('This name already exists, including inactive records',409);
      throw error;
    } finally {client.release();}
  }
  list(token:string,kind:ReferenceKind,offset=0) {
    // Parse again at the SQL boundary: only these two table names can be interpolated.
    const table=referenceKind.parse(kind);
    return this.run(token,undefined,async client=>({
      items:(await client.query(`SELECT id,name,is_active,version FROM ${table} ORDER BY name,id LIMIT 20 OFFSET $1`,[offset])).rows,
      total:(await client.query(`SELECT count(*)::int n FROM ${table}`)).rows[0].n as number
    }));
  }
  create(token:string,csrf:string,kind:ReferenceKind,input:z.infer<typeof referenceCreate>) {
    const table=referenceKind.parse(kind),details=referenceCreate.parse(input);
    return this.run(token,csrf,async client=>(await client.query(`INSERT INTO ${table}(name) VALUES($1) RETURNING id,name,is_active,version`,[details.name])).rows[0]);
  }
  change(token:string,csrf:string,kind:ReferenceKind,id:string,input:z.infer<typeof referenceChange>) {
    const table=referenceKind.parse(kind),details=referenceChange.parse(input);z.uuid().parse(id);
    return this.run(token,csrf,async client=>{
      const result=await client.query(`UPDATE ${table} SET name=$2,is_active=$3 WHERE id=$1 AND version=$4 RETURNING id,name,is_active,version`,[id,details.name,details.isActive,details.expectedVersion]);
      if(!result.rowCount)throw new HttpException('Reference changed or is unavailable; refresh before retrying',409);
      return result.rows[0];
    });
  }
}
