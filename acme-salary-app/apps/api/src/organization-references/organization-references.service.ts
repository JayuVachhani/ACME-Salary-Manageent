import { sqlState } from '../database/database-errors.js';
import { requiredRow } from '../database/query-result.js';
import type { ReferenceResponse } from './dto/organization-references-response.dto.js';
import { withTransaction } from '../database/transaction.js';
import { ApplicationError } from '../common/errors/application-error.js';
import { Inject, Injectable } from '@nestjs/common';
import {
  referenceKind,
  ReferenceKind,
  referenceCreate,
  referenceChange,
} from './dto/organization-references.dto.js';
import { Pool, type PoolClient } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from '../auth/authentication.service.js';
@Injectable()
export class OrganizationReferencesService {
  constructor(
    @Inject(Pool) private readonly pool: Pool,
    @Inject(AuthenticationService) private readonly auth: AuthenticationService,
  ) {}
  private async run<T>(
    token: string,
    csrf: string | undefined,
    work: (client: PoolClient) => Promise<T>,
  ) {
    try {
      return await withTransaction(this.pool, async (client) => {
        if (csrf !== undefined && !csrf) throw new ApplicationError('CSRF token required', 403);
        const user = await this.auth.authenticateWithin(client, token, csrf);
        if (!user)
          throw new ApplicationError(
            csrf === undefined ? 'Sign in required' : 'Request rejected',
            csrf === undefined ? 401 : 403,
          );
        if (!user.isHrManager) throw new ApplicationError('HR Manager access required', 403);
        await client.query("SELECT set_config('acme.reference_actor',$1,true)", [user.id]);
        const result = await work(client);
        return result;
      });
    } catch (error) {
      if (sqlState(error) === '23505')
        throw new ApplicationError('This name already exists, including inactive records', 409);
      throw error;
    }
  }
  list(token: string, kind: ReferenceKind, offset = 0) {
    // Parse again at the SQL boundary: only these two table names can be interpolated.
    const table = referenceKind.parse(kind);
    return this.run(token, undefined, async (client) => ({
      items: (
        await client.query<ReferenceResponse>(
          `SELECT id,name,is_active,version FROM ${table} ORDER BY name,id LIMIT 20 OFFSET $1`,
          [offset],
        )
      ).rows,
      total: requiredRow(await client.query<{ n: number }>(`SELECT count(*)::int n FROM ${table}`))
        .n,
    }));
  }
  create(token: string, csrf: string, kind: ReferenceKind, input: z.infer<typeof referenceCreate>) {
    const table = referenceKind.parse(kind),
      details = referenceCreate.parse(input);
    return this.run(token, csrf, async (client) =>
      requiredRow(
        await client.query<ReferenceResponse>(
          `INSERT INTO ${table}(name) VALUES($1) RETURNING id,name,is_active,version`,
          [details.name],
        ),
      ),
    );
  }
  change(
    token: string,
    csrf: string,
    kind: ReferenceKind,
    id: string,
    input: z.infer<typeof referenceChange>,
  ) {
    const table = referenceKind.parse(kind),
      details = referenceChange.parse(input);
    z.uuid().parse(id);
    return this.run(token, csrf, async (client) => {
      const result = await client.query<ReferenceResponse>(
        `UPDATE ${table} SET name=$2,is_active=$3 WHERE id=$1 AND version=$4 RETURNING id,name,is_active,version`,
        [id, details.name, details.isActive, details.expectedVersion],
      );
      if (!result.rowCount)
        throw new ApplicationError(
          'Reference changed or is unavailable; refresh before retrying',
          409,
        );
      return requiredRow(result);
    });
  }
}
