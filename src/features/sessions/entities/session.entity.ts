import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Seat } from './seat.entity';

@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  movieTitle: string;

  @Column()
  roomId: string;

  @Column()
  startTime: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => Seat, (seat) => seat.session, { cascade: true })
  seats: Seat[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
