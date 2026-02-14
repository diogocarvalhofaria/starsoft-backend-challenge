import { SessionController } from './session.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../service/session.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { faker } from '@faker-js/faker';

describe('sessionController', () => {
  let sessionController: SessionController;

  const mockSessionService = {
    createSession: jest.fn(),
    findAllSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    }).compile();
    sessionController = module.get<SessionController>(SessionController);
  });

  it('creating sessions', async () => {
    const createSessionDto: CreateSessionDto = {
      movieTitle: 'Senna: O Brasileiro, O Herói, O Campeão',
      roomId: faker.string.numeric({ length: { min: 1, max: 30 } }),
      startTime: '2026-02-20T19:00:00Z',
      price: 25.0,
    };
    await sessionController.createSession(createSessionDto);
    expect(mockSessionService.createSession).toHaveBeenCalledWith(
      createSessionDto,
    );
  });

  it('Search all sessions', async () => {
    await sessionController.findAllSession();
    expect(mockSessionService.findAllSession).toHaveBeenCalledWith();
  });
});
