import { Module } from '@nestjs/common';
import { QueuesModule } from './queues/queue.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from './features/sessions/session.module';
import { ReservationModule } from './features/reservations/reservation.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    QueuesModule,
    SessionModule,
    ReservationModule,
    LoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
