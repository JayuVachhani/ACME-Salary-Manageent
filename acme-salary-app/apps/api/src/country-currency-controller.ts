import {Body,Controller,Get,HttpException,Param,Patch,Post,Req} from '@nestjs/common';
import type {Request} from 'express';
import type {Pool} from 'pg';
import {z} from 'zod';
import type {loadConfig} from './config.js';
import {AuthenticationService} from './authentication.js';
import {CountryCurrencyService,countryInput,countryChange,currencyChange,countryCode,currencyCode} from './country-currency.js';
export function countryCurrencyController(pool:Pool,config:ReturnType<typeof loadConfig>){
  const service=new CountryCurrencyService(pool,new AuthenticationService(pool,config.OTP_HMAC_SECRET,()=>new Date(),{
    otpMinutes:config.OTP_TTL_MINUTES,idleMinutes:config.SESSION_IDLE_MINUTES,absoluteHours:config.SESSION_ABSOLUTE_HOURS}));
  const token=(req:Request)=>req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('acme_session='))?.slice(13)??'';
  const csrf=(req:Request)=>{if(req.headers.origin!==config.APP_ORIGIN||!req.header('X-CSRF-Token'))throw new HttpException('Request rejected',403);return req.header('X-CSRF-Token')!;};
  const parse=<T>(schema:z.ZodType<T>,value:unknown):T=>{const r=schema.safeParse(value);if(!r.success)throw new HttpException('Invalid country or currency details',400);return r.data;};
  @Controller('/api/v1')
  class CountryCurrencyController{
    @Get('currency-catalogue') catalogue(@Req() req:Request){return service.catalogue(token(req));}
    @Get('currencies') currencies(@Req() req:Request){return service.currencies(token(req));}
    @Patch('currencies/:code') activate(@Req() req:Request,@Param('code') code:string,@Body() body:unknown){return service.activate(token(req),csrf(req),parse(currencyCode,code),parse(currencyChange,body));}
    @Get('countries') countries(@Req() req:Request){const q=parse(z.object({offset:z.coerce.number().int().min(0).max(100000).default(0)}).strict(),req.query);return service.countries(token(req),q.offset);}
    @Post('countries') create(@Req() req:Request,@Body() body:unknown){return service.create(token(req),csrf(req),parse(countryInput,body));}
    @Patch('countries/:code') change(@Req() req:Request,@Param('code') code:string,@Body() body:unknown){return service.change(token(req),csrf(req),parse(countryCode,code),parse(countryChange,body));}
  }
  return CountryCurrencyController;
}
