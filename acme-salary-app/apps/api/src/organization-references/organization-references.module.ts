import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuthenticationService } from '../auth/authentication.service.js';
import { OrganizationReferencesController } from './organization-references.controller.js';
import { OrganizationReferencesService } from './organization-references.service.js';
@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule], controllers: [OrganizationReferencesController], providers: [
    {
      provide: OrganizationReferencesService, inject: [Pool, AuthenticationService],
      useFactory: (pool: Pool, auth: AuthenticationService) => new OrganizationReferencesService(pool, auth)
    },
  ]
})
export class OrganizationReferencesModule {
}
