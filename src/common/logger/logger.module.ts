import { Module, Global } from '@nestjs/common';
import { AppLogger } from './service/logger.service';

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
