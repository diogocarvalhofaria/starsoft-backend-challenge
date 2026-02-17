import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { DataSource, Repository } from 'typeorm';
import { Seat, SeatStatus } from '../../sessions/entities/seat.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SearchUserReservationDto } from '../dto/search-user-reservation.dto';
import { LoggerService } from '../../../common/logger/service/logger.service';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private readonly connection: DataSource,
    private readonly logger: LoggerService,

    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,

    @InjectQueue('reservations') private reservationQueue: Queue,
  ) {}

  /*
    Este metodo é responsavel pela criação de reserva do usuario.
    Inicio ele com uma transaction para garantir a atomicidade do processo, porque ou a reserva acontece, ou não acontece.
   */
  async createReservation(data: CreateReservationDto) {
    return await this.connection.transaction(async (manager) => {
      const seat = await manager.findOne(Seat, {
        where: { id: data.seatId },
        lock: { mode: 'pessimistic_write' }, //trava enquanto uma pessoa está fazendo a reserva
      });

      if (!seat) {
        this.logger.error(`Assento não encontrado: ${data.seatId}`);
        throw new Error('Assento não encontrado');
      }

      if (seat.status !== SeatStatus.AVAILABLE) {
        this.logger.warn(
          `Assento já está vendido ou reservado. Assento: ${data.seatId}, Status: ${seat.status}`,
        );
        throw new ConflictException('Assento já está vendido ou reservado.');
      }

      seat.status = SeatStatus.LOCKED;
      await manager.save(seat);

      const reservation = manager.create(Reservation, {
        userId: data.userId,
        seatId: data.seatId,
        status: ReservationStatus.PENDING,
      });

      const savedReservation = await manager.save(reservation);
      this.logger.info(
        `Reserva criada com sucesso. Reserva: ${savedReservation.id}, User: ${data.userId}`,
      );
      await this.reservationQueue.add(
        'cancel-reservation',
        { reservationId: savedReservation.id },
        { delay: 30000 },
      );

      return savedReservation;
    });
  }

  /*
  Este metodo é responsavel por listar todas as reservas
   */
  async findAllReservation() {
    return await this.reservationRepository.find({
      relations: ['seat'],
    });
  }

  /*
   Este metodo ficou responsavel para confirmação de pagamento do usuario.
   Tambem iniciado com uma transaction para garantir a segurança do usuario mediante o pagamento.
   */
  async confirmPayment(reservationId: string) {
    return this.connection.transaction(async (transaction) => {
      const reservation = await transaction.findOne(Reservation, {
        where: { id: reservationId },
        relations: ['seat'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation) {
        this.logger.warn(`Reserva não encontrada ${reservationId}`);
        throw new NotFoundException('Reserva não encontrada');
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        this.logger.warn(`Reserva já confirmada ${reservationId}`);
        throw new ConflictException('Reserva já confirmada');
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        this.logger.warn(
          `Tempo expirado, você perdeu a reserva! ${reservation.id}`,
        );
        throw new BadRequestException('Tempo expirado, você perdeu a reserva!');
      }

      const dbDate = new Date(reservation.createdAt);
      const nowDate = new Date();
      const createdAtTime = dbDate.getTime();
      const nowTime = nowDate.getTime();

      const diffInSeconds = (nowTime - createdAtTime) / 1000;
      if (diffInSeconds > 30) {
        reservation.status = ReservationStatus.CANCELLED;
        await transaction.save(reservation);

        const seat = reservation.seat;
        seat.status = SeatStatus.AVAILABLE;
        await transaction.save(seat);

        this.logger.warn(
          `Tempo limite excedido (${diffInSeconds}s): ${reservationId}`,
        );
        throw new BadRequestException(
          `Tempo limite excedido (${diffInSeconds.toFixed(1)}s). Assento liberado.`,
        );
      }

      reservation.status = ReservationStatus.CONFIRMED;
      await transaction.save(reservation);

      const seat = reservation.seat;
      seat.status = SeatStatus.SOLD;
      await transaction.save(seat);
      this.logger.info(
        `Pagamento confirmado e assento vendido. ReservaID: ${reservation.id}`,
      );

      await this.reservationQueue.add('sale-confirmed', {
        reservationId: reservation.id,
        userId: reservation.userId,
        time: new Date(),
      });

      return reservation;
    });
  }

  /*
    Este metodo é responsavel por listar as reservas do usuario, com paginação e filtro por status.
    Desta forma consigo garantir tambem uma melhor performance na busca
   */
  async findReservationByUser(userId: string, data: SearchUserReservationDto) {
    const { limit = 10, offset = 0, status } = data;
    const [reservations, total] = await this.reservationRepository.findAndCount(
      {
        where: {
          userId,
          ...(status ? { status: status as ReservationStatus } : {}),
        },
        relations: ['seat', 'seat.session'],
        skip: offset,
        take: limit,
      },
    );
    return {
      data: reservations,
      count: total,
      limit: limit,
      offset: offset,
    };
  }
}
