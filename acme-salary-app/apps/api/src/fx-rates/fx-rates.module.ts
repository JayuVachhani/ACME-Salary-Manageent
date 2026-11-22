import { HttpModule } from '../common/http/http.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { FxRatesController } from './fx-rates.controller.js';
import { FxRatesService } from './fx-rates.service.js';
@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule, AuthModule],
  controllers: [FxRatesController],
  providers: [FxRatesService],
})
export class FxRatesModule {}
