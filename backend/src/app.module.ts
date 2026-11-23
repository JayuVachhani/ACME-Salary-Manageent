import { ResponseContractInterceptor } from './common/http/response-contract.interceptor.js';
import { SalaryModule } from './salary/salary.module.js';
import { APP_FILTER, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { RequestValidationPipe } from './common/pipes/request-validation.pipe.js';
import { HttpModule } from './common/http/http.module.js';
import { RequestContextMiddleware } from './common/http/request-context.middleware.js';
import type { NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { PayrollDraftsModule } from './payroll-drafts/payroll-drafts.module.js';
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    DatabaseModule,
    MailModule,
    AuthModule,
    TeamModule,
    OrganizationReferencesModule,
    CountryCurrencyModule,
    FxRatesModule,
    EmployeesModule,
    HealthModule,
    SalaryModule,
    PayrollDraftsModule,
  ],
  providers: [
    ApplicationLifecycle,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: RequestValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ResponseContractInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('{*splat}');
  }
}
