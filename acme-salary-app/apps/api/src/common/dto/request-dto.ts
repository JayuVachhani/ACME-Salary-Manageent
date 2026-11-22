import type { ZodType, output } from 'zod';

export interface RequestDtoClass<T = unknown> {
  new (): T;
  readonly schema: ZodType<T>;
  readonly errorMessage: string;
  readonly deferredValidation?: boolean;
}

/** Runtime metadata for Nest, with one schema for transport validation and API documentation. */
export function requestDto<S extends ZodType>(
  schema: S,
  errorMessage: string,
): RequestDtoClass<output<S>> {
  class SchemaDto {
    static readonly schema = schema;
    static readonly errorMessage = errorMessage;
  }
  // The global pipe returns the schema output; constructing an unvalidated DTO is never the request path.
  return SchemaDto as unknown as RequestDtoClass<output<S>>;
}
