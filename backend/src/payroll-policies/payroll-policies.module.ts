import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { HttpModule } from '../common/http/http.module.js';
import { PayrollPoliciesService } from './payroll-policies.service.js';
import { PayrollPoliciesController } from './payroll-policies.controller.js';
@Module({
  imports: [AuthModule, DatabaseModule, HttpModule],
  providers: [PayrollPoliciesService],
  controllers: [PayrollPoliciesController],
  exports: [PayrollPoliciesService],
})
export class PayrollPoliciesModule {}
