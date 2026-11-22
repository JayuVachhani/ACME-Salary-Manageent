import { HttpModule } from '../common/http/http.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CountryCurrencyController } from './country-currency.controller.js';
import { CountryCurrencyService } from './country-currency.service.js';
@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule, AuthModule],
  controllers: [CountryCurrencyController],
  providers: [CountryCurrencyService],
})
export class CountryCurrencyModule {}
