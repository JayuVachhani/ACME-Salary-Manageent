import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
import { PayrollDeliveryService } from './payroll-delivery.service.js';
import {
  DeliveryListDto,
  DeliveryPageDto,
  DeliveryRunParamsDto,
  DeliveryPayslipParamsDto,
  DeliveryCommandDto,
  PreparationDto,
  ExternalPaymentDto,
  deliveryRun,
  deliveryRunPage,
  deliveryPayslipPage,
  finalizedPayslip,
  preparationPage,
  paymentPreparation,
  manifestPage,
  documentResponse,
} from './dto/payroll-delivery.dto.js';
@ApiTags('Finalized payslips and payment preparation')
@ApiSession()
@ApiErrors(400, 401, 403, 404, 409, 500)
@UseGuards(MutationRequestGuard)
@Controller('/api/v1/payroll-delivery')
export class PayrollDeliveryController {
  constructor(
    @Inject(RequestSecurity) private readonly security: RequestSecurity,
    @Inject(PayrollDeliveryService) private readonly service: PayrollDeliveryService,
  ) {}
  @Get('runs')
  @ApiInput(DeliveryListDto, 'query')
  @ApiResult(deliveryRunPage)
  runs(@Req() req: Request, @Query() query: DeliveryListDto) {
    return this.service.list(this.security.token(req), query.period, query.page);
  }
  @Get('runs/:id')
  @ApiInput(DeliveryRunParamsDto, 'path')
  @ApiResult(deliveryRun)
  run(@Req() req: Request, @Param() params: DeliveryRunParamsDto) {
    return this.service.detailRun(this.security.token(req), params.id);
  }
  @Get('runs/:id/payslips')
  @ApiInput(DeliveryRunParamsDto, 'path')
  @ApiInput(DeliveryPageDto, 'query')
  @ApiResult(deliveryPayslipPage)
  payslips(
    @Req() req: Request,
    @Param() params: DeliveryRunParamsDto,
    @Query() query: DeliveryPageDto,
  ) {
    return this.service.payslips(this.security.token(req), params.id, query.page);
  }
  @Get('runs/:id/payslips/:employeeId')
  @ApiInput(DeliveryPayslipParamsDto, 'path')
  @ApiResult(finalizedPayslip)
  payslip(@Req() req: Request, @Param() params: DeliveryPayslipParamsDto) {
    return this.service.payslip(this.security.token(req), params.id, params.employeeId);
  }
  @Post('runs/:id/payslips/:employeeId/download')
  @ApiMutation()
  @ApiInput(DeliveryPayslipParamsDto, 'path')
  @ApiInput(DeliveryCommandDto, 'body')
  @ApiResult(documentResponse, 201)
  downloadPayslip(
    @Req() req: Request,
    @Param() params: DeliveryPayslipParamsDto,
    @Body() body: DeliveryCommandDto,
  ) {
    return this.service.downloadPayslip(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      params.employeeId,
      body.commandId,
    );
  }
  @Get('runs/:id/payment-preparations')
  @ApiInput(DeliveryRunParamsDto, 'path')
  @ApiInput(DeliveryPageDto, 'query')
  @ApiResult(preparationPage)
  preparations(
    @Req() req: Request,
    @Param() params: DeliveryRunParamsDto,
    @Query() query: DeliveryPageDto,
  ) {
    return this.service.preparations(this.security.token(req), params.id, query.page);
  }
  @Post('runs/:id/payment-preparations')
  @ApiMutation()
  @ApiInput(DeliveryRunParamsDto, 'path')
  @ApiInput(PreparationDto, 'body')
  @ApiResult(paymentPreparation, 201)
  prepare(
    @Req() req: Request,
    @Param() params: DeliveryRunParamsDto,
    @Body() body: PreparationDto,
  ) {
    return this.service.prepare(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.commandId,
      body.reason,
    );
  }
  @Get('payment-preparations/:id/manifest')
  @ApiInput(DeliveryRunParamsDto, 'path')
  @ApiInput(DeliveryPageDto, 'query')
  @ApiResult(manifestPage)
  manifest(
    @Req() req: Request,
    @Param() params: DeliveryRunParamsDto,
    @Query() query: DeliveryPageDto,
  ) {
    return this.service.manifest(this.security.token(req), params.id, query.page);
  }
  @Post('payment-preparations/:id/download')
  @ApiMutation()
  @ApiInput(DeliveryRunParamsDto, 'path')
  @ApiInput(DeliveryCommandDto, 'body')
  @ApiResult(documentResponse, 201)
  downloadManifest(
    @Req() req: Request,
    @Param() params: DeliveryRunParamsDto,
    @Body() body: DeliveryCommandDto,
  ) {
    return this.service.downloadManifest(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body.commandId,
    );
  }
  @Post('payment-preparations/:id/external-payment')
  @ApiMutation()
  @ApiInput(DeliveryRunParamsDto, 'path')
  @ApiInput(ExternalPaymentDto, 'body')
  @ApiResult(paymentPreparation, 201)
  report(
    @Req() req: Request,
    @Param() params: DeliveryRunParamsDto,
    @Body() body: ExternalPaymentDto,
  ) {
    return this.service.reportExternalPayment(
      this.security.token(req),
      this.security.csrf(req),
      params.id,
      body,
    );
  }
}
