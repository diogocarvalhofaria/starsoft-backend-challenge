import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/pagination.dto';

export class SearchUserReservationDto extends PaginationDto {
  @ApiProperty({
    example: 'CANCELlED, PENDING, CONFIRMED',
    description: 'Status da reserva',
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}
