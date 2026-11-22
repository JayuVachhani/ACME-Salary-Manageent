import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiHeader,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger';
import { z } from 'zod';
import { RESPONSE_SCHEMA } from './response-contract.js';
import type { RequestDtoClass } from '../dto/request-dto.js';

function schemaFor(schema: z.ZodType, io: 'input' | 'output' = 'output'): SchemaObject {
  return z.toJSONSchema(schema, { target: 'openapi-3.0', io }) as SchemaObject;
}
export function ApiInput(dto: RequestDtoClass, location: 'body' | 'query' | 'path') {
  const schema = schemaFor(dto.schema, location === 'body' ? 'input' : 'output');
  if (location === 'body') return ApiBody({ required: true, schema });
  const required = new Set(schemaFor(dto.schema, 'input').required ?? []);
  return applyDecorators(
    ...Object.entries(schema.properties ?? {}).map(([name, property]) => {
      const parameterSchema: SchemaObject = '$ref' in property ? { allOf: [property] } : property;
      return location === 'path'
        ? ApiParam({ name, required: true, schema: parameterSchema })
        : ApiQuery({ name, required: required.has(name), schema: parameterSchema });
    }),
  );
}
export function ApiResult(schema: z.ZodType, status = 200, description = 'Successful response') {
  return applyDecorators(
    SetMetadata(RESPONSE_SCHEMA, schema),
    ApiResponse({ status, description, schema: schemaFor(schema) }),
  );
}
const errorSchema = schemaFor(
  z.object({ statusCode: z.number().int(), message: z.string(), error: z.string().optional() }),
);
export function ApiErrors(...statuses: number[]) {
  const descriptions: Record<number, string> = {
    400: 'Invalid request',
    401: 'Sign in required or invalid/expired OTP',
    403: 'Origin, CSRF or current permissions rejected',
    404: 'Resource unavailable',
    409: 'Version conflict or protected reference unavailable',
    422: 'No eligible FX resolution',
    429: 'Too many authentication attempts',
    500: 'Unexpected service failure; details are not disclosed',
  };
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: descriptions[status] ?? 'Request failed',
        schema: errorSchema,
      }),
    ),
  );
}
export function ApiSession() {
  return ApiCookieAuth('session');
}
export function ApiMutation() {
  return applyDecorators(
    ApiHeader({ name: 'Origin', required: true, description: 'Must equal configured APP_ORIGIN' }),
    ApiHeader({
      name: 'X-CSRF-Token',
      required: true,
      description: 'Current CSRF hint, verified against the current server session',
    }),
  );
}
