import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthenticationService } from '../auth/authentication.service.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule], controllers: [EmployeesController], providers: [
    {
      provide: EmployeesService, inject: [Pool, AuthenticationService],
      useFactory: (pool: Pool, auth: AuthenticationService) => new EmployeesService(pool, auth)
    },
  ]
})
export class EmployeesModule {
}
