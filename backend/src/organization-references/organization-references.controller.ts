import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequestSecurity } from '../common/http/request-security.service.js';
import { MutationRequestGuard } from '../common/http/mutation-request.guard.js';
import {
  ApiErrors,
  ApiInput,
  ApiMutation,
  ApiResult,
  ApiSession,
} from '../common/http/api-contract.decorators.js';
import { OrganizationReferencesService } from './organization-references.service.js';
import {
  CreateReferenceDto,
  ChangeReferenceDto,
  ReferenceKindParamsDto,
  ReferenceParamsDto,
  ReferenceOffsetQueryDto,
} from './dto/organization-references.dto.js';
import {
  referenceResponse,
  referencePageResponse,
} from './dto/organization-references-response.dto.js';

@ApiTags('Organization references')
@ApiSession()
@ApiErrors(400, 401, 403, 409, 500)
@Controller('/api/v1/organization-references')
@UseGuards(MutationRequestGuard)
export class OrganizationReferencesController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(OrganizationReferencesService) private readonly service: OrganizationReferencesService,
  ) {}

  @Get(':kind')
  @ApiInput(ReferenceKindParamsDto, 'path')
  @ApiInput(ReferenceOffsetQueryDto, 'query')
  @ApiResult(referencePageResponse)
  list(
    @Req() req: Request,
    @Param() params: ReferenceKindParamsDto,
    @Query() query: ReferenceOffsetQueryDto,
  ) {
    return this.service.list(this.security.token(req), params.kind, query.offset);
  }

  @Post(':kind')
  @ApiMutation()
  @ApiInput(ReferenceKindParamsDto, 'path')
  @ApiInput(CreateReferenceDto, 'body')
  @ApiResult(referenceResponse, 201)
  create(
    @Req() req: Request,
    @Param() params: ReferenceKindParamsDto,
    @Body() body: CreateReferenceDto,
  ) {
    return this.service.create(
      this.security.token(req),
      this.security.csrf(req),
      params.kind,
      body,
    );
  }

  @Patch(':kind/:id')
  @ApiMutation()
  @ApiInput(ReferenceParamsDto, 'path')
  @ApiInput(ChangeReferenceDto, 'body')
  @ApiResult(referenceResponse)
  change(
    @Req() req: Request,
    @Param() params: ReferenceParamsDto,
    @Body() body: ChangeReferenceDto,
  ) {
    return this.service.change(
      this.security.token(req),
      this.security.csrf(req),
      params.kind,
      params.id,
      body,
    );
  }
}
