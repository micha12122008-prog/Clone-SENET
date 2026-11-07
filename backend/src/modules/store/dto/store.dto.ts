import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Monster Energy 0.5L', description: 'Назва товару' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'DRINKS', enum: ['DRINKS', 'SNACKS', 'MERCH', 'SERVICES'] })
  @IsEnum(['DRINKS', 'SNACKS', 'MERCH', 'SERVICES'])
  category: string;

  @ApiProperty({ example: 65.0, description: 'Ціна' })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ example: 50, description: 'Кількість на складі' })
  @IsNumber()
  @Min(0)
  stockQuantity: number;
}

export class OrderItemDto {
  @ApiProperty({ example: 'prod-1', description: 'ID товару' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Кількість' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'comp-2', description: 'Номер або ID ПК для доставки', required: false })
  @IsString()
  @IsOptional()
  computerId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  items: OrderItemDto[];
}
