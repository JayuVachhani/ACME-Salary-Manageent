import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { HttpModule } from '../common/http/http.module.js';
import { PayrollPoliciesModule } from '../payroll-policies/payroll-policies.module.js';
import { PayrollCalculationsService } from './payroll-calculations.service.js';
import { PayrollCalculationsController } from './payroll-calculations.controller.js';
@Module({
  imports: [AuthModule, DatabaseModule, HttpModule, PayrollPoliciesModule],
  providers: [PayrollCalculationsService],
  controllers: [PayrollCalculationsController],
  exports: [PayrollCalculationsService],
})
export class PayrollCalculationsModule {}
