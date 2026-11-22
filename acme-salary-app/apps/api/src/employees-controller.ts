import {Controller,Get,HttpException,Param,Req} from '@nestjs/common';
import type {Request} from 'express';
import type {Pool} from 'pg';
import type {loadConfig} from './config.js';
import {AuthenticationService} from './authentication.js';
import {EmployeesService,employeeQuery,employeeId} from './employees.js';
export function employeesController(pool:Pool,config:ReturnType<typeof loadConfig>){
 const service=new EmployeesService(pool,new AuthenticationService(pool,config.OTP_HMAC_SECRET,()=>new Date(),{otpMinutes:config.OTP_TTL_MINUTES,idleMinutes:config.SESSION_IDLE_MINUTES,absoluteHours:config.SESSION_ABSOLUTE_HOURS}));
 const token=(req:Request)=>req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('acme_session='))?.slice(13)??'';
 @Controller('/api/v1/employees')
 class EmployeesController{
  @Get() list(@Req() req:Request){const q=employeeQuery.safeParse(req.query);if(!q.success)throw new HttpException('Invalid employee filters or pagination',400);return service.list(token(req),q.data);}
  @Get('filters') filters(@Req() req:Request){return service.filters(token(req));}
  @Get(':id') detail(@Req() req:Request,@Param('id') id:string){if(!employeeId.safeParse(id).success)throw new HttpException('Invalid employee identifier',400);return service.detail(token(req),id);}
 }
 return EmployeesController;
}
