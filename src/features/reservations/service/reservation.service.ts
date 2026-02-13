import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { OptimisticLockVersionMismatchError, Repository } from 'typeorm';
import { Seat, SeatStatus } from '../../sessions/entities/seat.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,

    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,

    @InjectQueue('reservations') private reservationQueue: Queue,
  ) {}
  async createReservation(data: CreateReservationDto) {
    const seat = await this.seatRepository.findOne({
      where: { id: data.seatId },
    });

    if (!seat) {
      throw new Error('Assento não encontrado');
    }

    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new ConflictException('Assento já está vendido ou reservado.');
    }

    seat.status = SeatStatus.LOCKED;

    try {
      await this.seatRepository.save(seat);
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'Alguem já reservou esse assento antes de você.',
        );
      }
      throw error;
    }
    const reservation = this.reservationRepository.create({
      userId: data.userId,
      seatId: data.seatId,
      status: ReservationStatus.PENDING,
    });
    const savedReservation = await this.reservationRepository.save(reservation);

    await this.reservationQueue.add(
      'cancel-reservation',
      { reservationId: savedReservation.id },
      { delay: 30000 },
    );
    return savedReservation;
  }

  async findAllReservation() {
    return await this.reservationRepository.find({
      relations: ['seat'],
    });
  }

  async confirmPayment(reservationId: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['seat'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (reservation.status === ReservationStatus.CONFIRMED) {
      throw new ConflictException('Reserva já confirmada');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Tempo expirado, você perdeu a reserva!');
    }

    const dbDate = new Date(reservation.createdAt);
    const nowDate = new Date();
    const createdAtTime = dbDate.getTime();
    const nowTime = nowDate.getTime();

    const diffInSeconds = (nowTime - createdAtTime) / 1000;
    if (diffInSeconds > 30) {
      reservation.status = ReservationStatus.CANCELLED;
      await this.reservationRepository.save(reservation);

      const seat = reservation.seat;
      seat.status = SeatStatus.AVAILABLE;
      await this.seatRepository.save(seat);

      throw new BadRequestException(
        `Tempo limite excedido (${diffInSeconds.toFixed(1)}s). Assento liberado.`,
      );
    }

    reservation.status = ReservationStatus.CONFIRMED;
    const savedReservation = await this.reservationRepository.save(reservation);

    const seat = reservation.seat;
    seat.status = SeatStatus.SOLD;
    await this.seatRepository.save(seat);

    return savedReservation;
  }

  async findReservationByUser(userId: string) {
    return this.reservationRepository.find({
      where: { userId },
      relations: ['seat', 'seat.session'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
