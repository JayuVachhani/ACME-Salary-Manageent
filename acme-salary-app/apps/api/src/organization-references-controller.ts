import { Body,Controller,Get,HttpException,Param,Patch,Post,Req } from '@nestjs/common';
import type { Request } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { AuthenticationService } from './authentication.js';
import type { loadConfig } from './config.js';
import { OrganizationReferencesService,referenceKind,referenceCreate,referenceChange } from './organization-references.js';

export function organizationReferencesController(pool:Pool,config:ReturnType<typeof loadConfig>) {
  const auth=new AuthenticationService(pool,config.OTP_HMAC_SECRET,()=>new Date(),{
    otpMinutes:config.OTP_TTL_MINUTES,idleMinutes:config.SESSION_IDLE_MINUTES,absoluteHours:config.SESSION_ABSOLUTE_HOURS});
  const service=new OrganizationReferencesService(pool,auth);
  const token=(req:Request)=>req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('acme_session='))?.slice(13)??'';
  const parse=<T>(schema:z.ZodType<T>,value:unknown):T=>{const result=schema.safeParse(value);if(!result.success)throw new HttpException('Invalid reference details',400);return result.data;};
  const csrf=(req:Request)=>{if(req.headers.origin!==config.APP_ORIGIN||!req.header('X-CSRF-Token'))throw new HttpException('Request rejected',403);return req.header('X-CSRF-Token')!;};
  @Controller('/api/v1/organization-references')
  class OrganizationReferencesController {
    @Get(':kind') list(@Req() req:Request,@Param('kind') kind:string) {
      const query=parse(z.object({offset:z.coerce.number().int().min(0).max(100000).default(0)}).strict(),req.query);
      return service.list(token(req),parse(referenceKind,kind),query.offset);
    }
    @Post(':kind') create(@Req() req:Request,@Param('kind') kind:string,@Body() body:unknown) {
      return service.create(token(req),csrf(req),parse(referenceKind,kind),parse(referenceCreate,body));
    }
    @Patch(':kind/:id') change(@Req() req:Request,@Param('kind') kind:string,@Param('id') id:string,@Body() body:unknown) {
      return service.change(token(req),csrf(req),parse(referenceKind,kind),parse(z.uuid(),id),parse(referenceChange,body));
    }
  }
  return OrganizationReferencesController;
}
