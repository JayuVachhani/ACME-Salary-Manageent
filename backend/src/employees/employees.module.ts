import { HttpModule } from '../common/http/http.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { EmployeeCreationService } from './employee-creation.service.js';
import { EmployeeEditingService } from './employee-editing.service.js';
@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule, AuthModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeCreationService, EmployeeEditingService],
})
export class EmployeesModule {}
