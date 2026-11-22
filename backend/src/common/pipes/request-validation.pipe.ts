import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import type { RequestDtoClass } from '../dto/request-dto.js';

function isRequestDto(value: unknown): value is RequestDtoClass {
  return typeof value === 'function' && 'schema' in value && 'errorMessage' in value;
}

@Injectable()
export class RequestValidationPipe implements PipeTransform<unknown, unknown> {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!['body', 'query', 'param'].includes(metadata.type)) return value;
    if (!isRequestDto(metadata.metatype)) {
      // Fail closed if a new transport input has no declared validation contract.
      throw new InternalServerErrorException('Request validation is not configured');
    }
    // Only OTP verification defers parsing so malformed attempts reach its throttle/audit boundary.
    if (metadata.metatype.deferredValidation) return value;
    const result = metadata.metatype.schema.safeParse(value);
    if (!result.success)
      throw new BadRequestException({ statusCode: 400, message: metadata.metatype.errorMessage });
    return result.data;
  }
}
