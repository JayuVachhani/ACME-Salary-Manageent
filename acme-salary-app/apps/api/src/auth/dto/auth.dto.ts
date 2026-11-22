import { requestDto } from '../../common/dto/request-dto.js';
import { z } from 'zod';
export const emailInput = z.object({ email: z.email().max(254).transform(value => value.trim().toLowerCase()) }).strict();
export const verifyInput = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) }).strict();

export class RequestOtpDto extends requestDto(emailInput, 'Enter a valid email address') {}

export class VerifyOtpDto extends requestDto(verifyInput, 'Invalid or expired code') {
  static readonly deferredValidation = true;
}
