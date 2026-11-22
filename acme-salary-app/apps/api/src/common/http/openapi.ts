import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Read-only API reference; no credentials are persisted and interactive mutations are disabled. */
export function configureOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('ACME Salary Management API')
    .setDescription('Delivered endpoints only. Cookie sessions and transactional permission checks remain authoritative. Salary writes, approvals and reports are not public APIs. Exact decimal amounts are JSON strings. Mutation requests require the configured Origin and current CSRF header.')
    .setVersion('1')
    .setOpenAPIVersion('3.0.3')
    .addCookieAuth('acme_session', { type: 'apiKey', in: 'cookie' }, 'session')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: '/api/openapi.json', yamlDocumentUrl: '/api/openapi.yaml',
    swaggerOptions: { supportedSubmitMethods: [], persistAuthorization: false },
  });
}
