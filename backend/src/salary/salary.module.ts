import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { SalaryApprovalService } from './salary-approval.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { HttpModule } from '../common/http/http.module.js';
import { SalaryWorkflowService } from './salary-workflow.service.js';
import { SalaryController } from './salary.controller.js';
@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, HttpModule],
  controllers: [SalaryController],
  providers: [SalaryApprovalService, SalaryWorkflowService],
})
export class SalaryModule {}
