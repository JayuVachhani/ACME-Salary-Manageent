import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { HttpModule } from '../common/http/http.module.js';
import { PayrollDraftsController } from './payroll-drafts.controller.js';
import { PayrollDraftsService } from './payroll-drafts.service.js';
@Module({
  imports: [AuthModule, DatabaseModule, HttpModule],
  controllers: [PayrollDraftsController],
  providers: [PayrollDraftsService],
})
export class PayrollDraftsModule {}
