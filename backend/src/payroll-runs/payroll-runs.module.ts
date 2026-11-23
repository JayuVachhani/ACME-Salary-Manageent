import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { HttpModule } from '../common/http/http.module.js';
import { PayrollPoliciesModule } from '../payroll-policies/payroll-policies.module.js';
import { PayrollCalculationsModule } from '../payroll-calculations/payroll-calculations.module.js';
import { PayrollRunsController } from './payroll-runs.controller.js';
import { PayrollRunsService } from './payroll-runs.service.js';
@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    HttpModule,
    PayrollPoliciesModule,
    PayrollCalculationsModule,
  ],
  controllers: [PayrollRunsController],
  providers: [PayrollRunsService],
  exports: [PayrollRunsService],
})
export class PayrollRunsModule {}
