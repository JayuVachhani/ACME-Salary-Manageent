import {Body,Controller,Get,HttpException,Post,Req} from '@nestjs/common';
import type {Request} from 'express';
import type {Pool} from 'pg';
import {z} from 'zod';
import type {loadConfig} from './config.js';
import {AuthenticationService} from './authentication.js';
import {FxRatesService,fxInput,fxQuery,fxResolve} from './fx-rates.js';
export function fxRatesController(pool:Pool,config:ReturnType<typeof loadConfig>){
  const service=new FxRatesService(pool,new AuthenticationService(pool,config.OTP_HMAC_SECRET,()=>new Date(),{
    otpMinutes:config.OTP_TTL_MINUTES,idleMinutes:config.SESSION_IDLE_MINUTES,absoluteHours:config.SESSION_ABSOLUTE_HOURS}),config.FX_MAX_STALENESS_DAYS);
  const token=(req:Request)=>req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('acme_session='))?.slice(13)??'';
  const parse=<T>(schema:z.ZodType<T>,input:unknown):T=>{const r=schema.safeParse(input);if(!r.success)throw new HttpException('Invalid FX details: check currencies, date, positive decimal rate (max 8 places), source, reason and revision',400);return r.data;};
  @Controller('/api/v1/fx-rates')
  class FxRatesController{
    @Get() list(@Req() req:Request){return service.list(token(req),parse(fxQuery,req.query));}
    @Get('resolve') resolve(@Req() req:Request){return service.resolve(token(req),parse(fxResolve,req.query));}
    @Post() append(@Req() req:Request,@Body() body:unknown){
      if(req.headers.origin!==config.APP_ORIGIN||!req.header('X-CSRF-Token'))throw new HttpException('Request rejected',403);
      return service.append(token(req),req.header('X-CSRF-Token')!,parse(fxInput,body));
    }
  }
  return FxRatesController;
}
