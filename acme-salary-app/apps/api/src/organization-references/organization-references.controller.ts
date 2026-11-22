import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { offsetQuery } from '../common/dto/pagination.dto.js';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { OrganizationReferencesService } from './organization-references.service.js';
import { referenceKind, referenceCreate, referenceChange, type ReferenceKind } from './dto/organization-references.dto.js';
const invalid = 'Invalid reference details';
@Controller('/api/v1/organization-references')
@UseGuards(MutationRequestGuard)
export class OrganizationReferencesController {
  constructor(@Inject(RequestSecurity) private readonly security: RequestSecurity, @Inject(OrganizationReferencesService) private readonly service: OrganizationReferencesService) {}
  @Get(':kind')
  list(@Req() req: Request, @Param('kind', new ZodValidationPipe(referenceKind, invalid)) kind: ReferenceKind, @Query(new ZodValidationPipe(offsetQuery, invalid)) query: z.infer<typeof offsetQuery>) { return this.service.list(this.security.token(req), kind, query.offset); }
  @Post(':kind')
  create(@Req() req: Request, @Param('kind', new ZodValidationPipe(referenceKind, invalid)) kind: ReferenceKind, @Body(new ZodValidationPipe(referenceCreate, invalid)) body: z.infer<typeof referenceCreate>) { return this.service.create(this.security.token(req), this.security.csrf(req), kind, body); }
  @Patch(':kind/:id')
  change(@Req() req: Request, @Param('kind', new ZodValidationPipe(referenceKind, invalid)) kind: ReferenceKind, @Param('id', new ZodValidationPipe(z.uuid(), invalid)) id: string, @Body(new ZodValidationPipe(referenceChange, invalid)) body: z.infer<typeof referenceChange>) { return this.service.change(this.security.token(req), this.security.csrf(req), kind, id, body); }
}
