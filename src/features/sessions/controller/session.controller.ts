import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionService } from '../service/session.service';
import { CreateSessionDto } from '../dto/create-session.dto';

@ApiTags('Sessões')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @ApiOperation({ summary: 'Cria sessão com 50 assentos' })
  createSession(@Body() data: CreateSessionDto) {
    return this.sessionService.createSession(data);
  }

  @Get()
  @ApiOperation({ summary: 'Lista sessões e assentos' })
  findAllSession() {
    return this.sessionService.findAllSession();
  }
}
