import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { SalaryApprovalService } from './salary-approval.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { HttpModule } from '../common/http/http.module.js';
import { SalaryWorkflowService } from './salary-workflow.service.js';
import { SalaryController } from './salary.controller.js';
import { SalaryWriteService } from './salary-write.service.js';
import { SalaryEmployeeController } from './salary-employee.controller.js';
import { SalaryWorkspaceController } from './salary-workspace.controller.js';
import { SalaryWorkspaceService } from './salary-workspace.service.js';
@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, HttpModule],
  controllers: [SalaryController, SalaryEmployeeController, SalaryWorkspaceController],
  providers: [
    SalaryApprovalService,
    SalaryWorkflowService,
    SalaryWriteService,
    SalaryWorkspaceService,
  ],
})
export class SalaryModule {}
