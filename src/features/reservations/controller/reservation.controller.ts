import { Controller, Post, Body, Get, HttpCode, Param } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { ReservationService } from '../service/reservation.service';

@ApiTags('Reservas')
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Reserva um assento' })
  @ApiResponse({ status: 201, description: 'Reserva criada com sucesso.' })
  @ApiResponse({
    status: 409,
    description: 'Assento já ocupado.',
  })
  createReservation(@Body() data: CreateReservationDto) {
    return this.reservationService.createReservation(data);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as reservas' })
  findAllReservation() {
    return this.reservationService.findAllReservation();
  }

  @Post(':reservationId/pay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirma o pagamento e finaliza a venda' })
  confirmPayment(@Param('reservationId') reservationId: string) {
    return this.reservationService.confirmPayment(reservationId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Histórico de reservas do usuário' })
  findReservationByUser(@Param('userId') userId: string) {
    return this.reservationService.findReservationByUser(userId);
  }
}
