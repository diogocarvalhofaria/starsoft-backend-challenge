import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  VersionColumn,
  Unique,
} from 'typeorm';
import { Session } from './session.entity';

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  SOLD = 'SOLD',
}

@Entity('seats')
@Unique(['session', 'row', 'number'])
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  row: string;

  @Column()
  number: number;

  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.AVAILABLE })
  status: SeatStatus;

  @ManyToOne(() => Session, (session) => session.seats, { onDelete: 'CASCADE' })
  session: Session;

  @Column()
  sessionId: string;

  @VersionColumn()
  version: number;
}
