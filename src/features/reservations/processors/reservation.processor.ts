import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { Repository } from 'typeorm';
import { Seat, SeatStatus } from '../../sessions/entities/seat.entity';
import { Job } from 'bullmq';

@Processor('reservations')
export class ReservationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReservationProcessor.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
  ) {
    super();
  }
  async process(job: Job<{ reservationId: string }>) {
    const { reservationId } = job.data;

    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['seat'],
    });

    if (!reservation) {
      this.logger.warn(`Reserva não encontrada: ${reservationId}`);
      return;
    }

    if (reservation.status === ReservationStatus.CONFIRMED) {
      this.logger.log(`Reserva já confirmada: ${reservationId}`);
      return;
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      this.logger.log(`Reserva já cancelada: ${reservationId}`);
      return;
    }

    reservation.status = ReservationStatus.CANCELLED;
    await this.reservationRepository.save(reservation);

    const seat = reservation.seat;
    seat.status = SeatStatus.AVAILABLE;
    await this.seatRepository.save(seat);

    this.logger.warn(
      `Tempo de reserva esgotado: ${reservationId}. Assento disponível.`,
    );
  }
}
