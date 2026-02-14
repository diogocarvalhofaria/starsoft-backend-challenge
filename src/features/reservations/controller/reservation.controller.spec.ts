import { ReservationController } from './reservation.controller';
import { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ReservationService } from '../service/reservation.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';

describe('ReservationController', () => {
  let reservationController: ReservationController;

  //jest.fn permite que eu simule funções e metodos
  const mockReservationService = {
    createReservation: jest.fn(),
    findAllReservation: jest.fn(),
    confirmPayment: jest.fn(),
    findReservationByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        { provide: ReservationService, useValue: mockReservationService },
      ],
    }).compile();
    reservationController = module.get<ReservationController>(
      ReservationController,
    );
  });

  it('Search reservations by user id', async () => {
    await reservationController.findReservationByUser('123');
    expect(mockReservationService.findReservationByUser).toHaveBeenCalledWith(
      '123',
    );
  });

  it('Search all reservations', async () => {
    await reservationController.findAllReservation();
    expect(mockReservationService.findAllReservation).toHaveBeenCalledWith();
  });

  it('Confirm payment', async () => {
    await reservationController.confirmPayment(
      'f99c79ef-6972-434f-91ac-017fe0816431',
    );
    expect(mockReservationService.confirmPayment).toHaveBeenCalledWith(
      'f99c79ef-6972-434f-91ac-017fe0816431',
    );
  });

  it('creating reservations', async () => {
    const createReservationDto: CreateReservationDto = {
      userId: '123456',
      seatId: '31405e9b-3a0b-4bb4-b72a-8555953bf285',
    };

    await reservationController.createReservation(createReservationDto);
    expect(mockReservationService.createReservation).toHaveBeenCalledWith(
      createReservationDto,
    );
  });

  it('Check if the seat is already reserved', async () => {
    const createReservationDto: CreateReservationDto = {
      userId: '123456',
      seatId: 'feb469a6-7d0f-4cc3-aa7e-26cf3978c6a5',
    };

    mockReservationService.createReservation.mockRejectedValue(
      new Error('Seat already reserved'),
    );

    await expect(
      reservationController.createReservation(createReservationDto),
    ).rejects.toThrow('Seat already reserved');
  });
});
