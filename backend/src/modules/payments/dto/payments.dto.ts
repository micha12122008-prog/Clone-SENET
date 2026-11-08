import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TopUpDto {
  @ApiProperty({ example: 200.0, description: 'Сума поповнення (грн)', minimum: 10 })
  @IsNumber()
  @Min(10)
  amount: number;
}

export class AdminTopUpDto {
  @ApiProperty({ example: 'user-1', description: 'ID користувача' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 500.0, description: 'Сума поповнення (грн)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'CASH', enum: ['CASH', 'CARD'], description: 'Спосіб оплати' })
  @IsString()
  @IsNotEmpty()
  method: string;
}

export class WebhookMockDto {
  @ApiProperty({ example: 'pay-tx-123456', description: 'ID транзакції шлюзу' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'FAIL'] })
  @IsString()
  @IsNotEmpty()
  status: string;
}
