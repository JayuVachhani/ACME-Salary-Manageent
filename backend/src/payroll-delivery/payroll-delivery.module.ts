import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { HttpModule } from '../common/http/http.module.js';
import { PayrollDeliveryController } from './payroll-delivery.controller.js';
import { PayrollDeliveryService } from './payroll-delivery.service.js';
@Module({
  imports: [AuthModule, DatabaseModule, HttpModule],
  controllers: [PayrollDeliveryController],
  providers: [PayrollDeliveryService],
})
export class PayrollDeliveryModule {}
