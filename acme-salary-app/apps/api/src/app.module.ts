import { ApplicationLifecycle } from './app-lifecycle.service.js';
import { MailModule } from './mail/mail.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TeamModule } from './team/team.module.js';
import { OrganizationReferencesModule } from './organization-references/organization-references.module.js';
import { CountryCurrencyModule } from './country-currency/country-currency.module.js';
import { FxRatesModule } from './fx-rates/fx-rates.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { HealthModule } from './health/health.module.js';
@Module({
  providers: [ApplicationLifecycle], imports: [MailModule, ConfigModule, DatabaseModule, AuthModule, TeamModule,
    OrganizationReferencesModule, CountryCurrencyModule, FxRatesModule, EmployeesModule, HealthModule]
})
export class AppModule {
}
