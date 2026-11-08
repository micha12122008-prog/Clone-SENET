import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto, CreateProductDto } from './dto/store.dto';

@ApiTags('Store')
@Controller('store')
export class StoreController {
  @Get('products')
  @ApiOperation({ summary: 'Каталог товарів та послуг магазину/бару' })
  getProducts() {
    return [
      {
        id: 'prod-1',
        name: 'Monster Energy Ultra White 0.5L',
        category: 'DRINKS',
        price: 65.0,
        stockQuantity: 45,
        isAvailable: true,
      },
      {
        id: 'prod-2',
        name: 'Чипси Lay’s Сметана та Зелень 120г',
        category: 'SNACKS',
        price: 45.0,
        stockQuantity: 25,
        isAvailable: true,
      },
    ];
  }

  @Post('products')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Додати товар на склад (Admin)' })
  createProduct(@Body() dto: CreateProductDto) {
    return {
      id: 'prod-new',
      ...dto,
      isAvailable: true,
    };
  }

  @Post('orders')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Оформлення замовлення (оплата з балансу клієнта)' })
  createOrder(@Body() dto: CreateOrderDto) {
    return {
      orderId: 'ord-101',
      computerId: dto.computerId || 'PC-02',
      status: 'NEW',
      totalAmount: 110.0,
      message: 'Замовлення прийнято! Бармен доставить його до вашого ПК.',
    };
  }

  @Get('orders')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Черга замовлень для бару/адміністратора' })
  getOrders() {
    return [
      {
        orderId: 'ord-101',
        computerName: 'PC-02',
        username: 's1mple_pro',
        items: [
          { name: 'Monster Energy 0.5L', quantity: 1, price: 65.0 },
          { name: 'Lay’s 120г', quantity: 1, price: 45.0 },
        ],
        totalAmount: 110.0,
        status: 'NEW',
        createdAt: '2026-10-24T19:40:00.000Z',
      },
    ];
  }

  @Get('orders/my')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Історія покупок клієнта' })
  getMyOrders() {
    return [
      {
        orderId: 'ord-101',
        totalAmount: 110.0,
        status: 'DELIVERED',
        createdAt: '2026-10-24T19:40:00.000Z',
      },
    ];
  }

  @Patch('orders/:id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Зміна статусу замовлення (PREPARING, DELIVERED, CANCELLED)' })
  updateOrderStatus(@Param('id') id: string) {
    return {
      orderId: id,
      status: 'DELIVERED',
      message: 'Замовлення доставлено клієнту',
    };
  }
}
