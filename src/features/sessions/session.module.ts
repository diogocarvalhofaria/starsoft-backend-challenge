import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Seat } from './entities/seat.entity';
import { SessionController } from './controller/session.controller';
import { SessionService } from './service/session.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Seat])],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [TypeOrmModule],
})
export class SessionsModule {}
