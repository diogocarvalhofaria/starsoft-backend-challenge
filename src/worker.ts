import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Worker');

  logger.log('Worker de Reservas iniciado e aguardando jobs...');
  app.enableShutdownHooks();
}

bootstrap().catch((err) => {
  console.error('Erro ao iniciar o Worker:', err);
  process.exit(1);
});
