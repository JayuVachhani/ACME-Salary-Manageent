import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { SalaryApprovalService } from './salary-approval.service.js';
/** Internal persistence/application capability only: no public salary handlers. */
@Module({ imports: [ConfigModule, DatabaseModule], providers: [SalaryApprovalService] })
export class SalaryModule {}
