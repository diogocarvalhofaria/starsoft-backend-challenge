import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { SessionsModule } from '../sessions/session.module';
import { ReservationController } from './controller/reservation.controller';
import { ReservationService } from './service/reservation.service';
import { BullModule } from '@nestjs/bullmq';
import { ReservationProcessor } from './processors/reservation.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    SessionsModule,
    BullModule.registerQueue({
      name: 'reservations',
    }),
  ],
  controllers: [ReservationController],
  providers: [ReservationService, ReservationProcessor],
  exports: [ReservationService],
})
export class ReservationModule {}
