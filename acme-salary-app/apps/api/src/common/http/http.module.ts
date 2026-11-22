import { MutationRequestGuard } from './mutation-request.guard.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module.js';
import { RequestSecurity } from './request-security.service.js';
@Module({ imports: [ConfigModule], providers: [RequestSecurity, MutationRequestGuard], exports: [RequestSecurity, MutationRequestGuard] })
export class HttpModule {
}
