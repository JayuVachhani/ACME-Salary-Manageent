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
import { CountryCurrencyService } from './country-currency.service.js';
import {
  CreateCountryDto,
  ChangeCountryDto,
  ChangeCurrencyDto,
  CountryParamsDto,
  CurrencyParamsDto,
  CountryOffsetQueryDto,
} from './dto/country-currency.dto.js';
import {
  catalogueResponse,
  currenciesResponse,
  currencyResponse,
  countriesResponse,
  countryResponse,
} from './dto/country-currency-response.dto.js';

@ApiTags('Countries and currencies')
@ApiSession()
@ApiErrors(400, 401, 403, 409, 500)
@Controller('/api/v1')
@UseGuards(MutationRequestGuard)
export class CountryCurrencyController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(CountryCurrencyService) private readonly service: CountryCurrencyService,
  ) {}

  @Get('currency-catalogue')
  @ApiResult(catalogueResponse)
  catalogue(@Req() req: Request) {
    return this.service.catalogue(this.security.token(req));
  }

  @Get('currencies')
  @ApiResult(currenciesResponse)
  currencies(@Req() req: Request) {
    return this.service.currencies(this.security.token(req));
  }

  @Patch('currencies/:code')
  @ApiMutation()
  @ApiInput(CurrencyParamsDto, 'path')
  @ApiInput(ChangeCurrencyDto, 'body')
  @ApiResult(currencyResponse)
  activate(
    @Req() req: Request,
    @Param() params: CurrencyParamsDto,
    @Body() body: ChangeCurrencyDto,
  ) {
    return this.service.activate(
      this.security.token(req),
      this.security.csrf(req),
      params.code,
      body,
    );
  }

  @Get('countries')
  @ApiInput(CountryOffsetQueryDto, 'query')
  @ApiResult(countriesResponse)
  countries(@Req() req: Request, @Query() query: CountryOffsetQueryDto) {
    return this.service.countries(this.security.token(req), query.offset);
  }

  @Post('countries')
  @ApiMutation()
  @ApiInput(CreateCountryDto, 'body')
  @ApiResult(countryResponse, 201)
  create(@Req() req: Request, @Body() body: CreateCountryDto) {
    return this.service.create(this.security.token(req), this.security.csrf(req), body);
  }

  @Patch('countries/:code')
  @ApiMutation()
  @ApiInput(CountryParamsDto, 'path')
  @ApiInput(ChangeCountryDto, 'body')
  @ApiResult(countryResponse)
  change(@Req() req: Request, @Param() params: CountryParamsDto, @Body() body: ChangeCountryDto) {
    return this.service.change(
      this.security.token(req),
      this.security.csrf(req),
      params.code,
      body,
    );
  }
}
