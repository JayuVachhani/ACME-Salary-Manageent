import { permissions } from '../../common/domain/policy.js';
import { z } from 'zod';
import { messageResponse } from '../../common/dto/message-response.dto.js';
export { messageResponse } from '../../common/dto/message-response.dto.js';
export const otpResponse = messageResponse.extend({ challengeId: z.uuid() });
export const identityResponse = z.object({
  id: z.uuid(),
  isHrManager: z.boolean(),
  permissions: z.array(z.enum(permissions)),
});
