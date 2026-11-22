import { Inject } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/config.module.js';
import { Body, Controller, Get, HttpException, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { OrganizationReferencesService, referenceKind, referenceCreate, referenceChange } from './organization-references.service.js';
@Controller('/api/v1/organization-references')
export class OrganizationReferencesController {
  constructor(
    @Inject(OrganizationReferencesService) private readonly service: OrganizationReferencesService,
    @Inject(APP_CONFIG) private readonly config: AppConfig) { }
  private readonly token = (req: Request) => req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('acme_session='))?.slice(13) ?? '';
  private readonly parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
    const result = schema.safeParse(value); if (!result.success)
      throw new HttpException('Invalid reference details', 400); return result.data;
  };
  private readonly csrf = (req: Request) => {
    if (req.headers.origin !== this.config.APP_ORIGIN || !req.header('X-CSRF-Token'))
      throw new HttpException('Request rejected', 403); return req.header('X-CSRF-Token')!;
  };
  @Get(':kind')
  list(
    @Req() req: Request,
    @Param('kind') kind: string) {
    const query = this.parse(z.object({ offset: z.coerce.number().int().min(0).max(100000).default(0) }).strict(), req.query);
    return this.service.list(this.token(req), this.parse(referenceKind, kind), query.offset);
  }
  @Post(':kind')
  create(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Body() body: unknown) {
    return this.service.create(this.token(req), this.csrf(req), this.parse(referenceKind, kind), this.parse(referenceCreate, body));
  }
  @Patch(':kind/:id')
  change(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() body: unknown) {
    return this.service.change(this.token(req), this.csrf(req), this.parse(referenceKind, kind), this.parse(z.uuid(), id), this.parse(referenceChange, body));
  }
}
