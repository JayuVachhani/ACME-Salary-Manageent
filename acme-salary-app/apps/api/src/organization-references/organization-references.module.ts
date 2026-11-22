import { HttpModule } from '../common/http/http.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { OrganizationReferencesController } from './organization-references.controller.js';
import { OrganizationReferencesService } from './organization-references.service.js';
@Module({
  imports: [HttpModule, ConfigModule, DatabaseModule, AuthModule], controllers: [OrganizationReferencesController], providers: [OrganizationReferencesService
  ]
})
export class OrganizationReferencesModule {
}
