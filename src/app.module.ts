import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueuesModule } from './queues/queue.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { SessionsModule } from './features/sessions/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    QueuesModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
