import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: '123', description: 'Id do usuário' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: '123',
    description: 'Id do assento',
  })
  @IsString()
  @IsNotEmpty()
  seatId: string;
}
