import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSessionDto } from '../dto/create-session.dto';
import { Session } from '../entities/session.entity';
import { Seat, SeatStatus } from '../entities/seat.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}
  async createSession(data: CreateSessionDto) {
    const session = this.sessionRepository.create(data);

    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    session.seats = [];

    rows.forEach((row) => {
      for (let number = 1; number <= 10; number++) {
        const seat = new Seat();
        seat.row = row;
        seat.number = number;
        seat.status = SeatStatus.AVAILABLE;
        session.seats.push(seat);
      }
    });

    return await this.sessionRepository.save(session);
  }

  async findAllSession() {
    return await this.sessionRepository.find({ relations: ['seats'] });
  }
}
