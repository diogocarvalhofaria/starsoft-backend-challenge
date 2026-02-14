import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 'naruto shippuden' })
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @ApiProperty({ example: '01' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: '2026-02-20T19:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @Min(1)
  price: number;
}
