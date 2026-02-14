import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ example: '123', description: 'ID do usuário simulado' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: '123',
    description: 'ID do assento desejado',
  })
  @IsString()
  @IsNotEmpty()
  seatId: string;
}
