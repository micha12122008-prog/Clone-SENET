import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminTopUpDto, TopUpDto, WebhookMockDto } from './dto/payments.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  @Post('top-up')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ініціалізація поповнення балансу (клієнт)' })
  topUp(@Body() dto: TopUpDto) {
    return {
      paymentId: 'pay-mock-987',
      amount: dto.amount,
      checkoutUrl: 'http://localhost:5173/mock-checkout?paymentId=pay-mock-987',
      status: 'PENDING',
    };
  }

  @Post('webhook-mock')
  @ApiOperation({ summary: 'Mock Webhook підтвердження успішної оплати' })
  webhookMock(@Body() dto: WebhookMockDto) {
    return {
      status: 'OK',
      processed: true,
      message: 'Кошти успішно зараховано на баланс клієнта',
    };
  }

  @Post('admin-top-up')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Поповнення балансу гравця через касу клубу адміністратором' })
  adminTopUp(@Body() dto: AdminTopUpDto) {
    return {
      userId: dto.userId,
      addedAmount: dto.amount,
      newBalance: 850.0,
      method: dto.method,
      message: `Баланс успішно поповнено на ${dto.amount} грн через касу клубу`,
    };
  }

  @Get('transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Повний журнал транзакцій клубу (фінансовий аудит)' })
  getTransactions() {
    return [
      {
        id: 'tx-1',
        username: 's1mple_pro',
        type: 'TOP_UP',
        amount: 500.0,
        balanceBefore: 0.0,
        balanceAfter: 500.0,
        description: 'Поповнення через касу',
        createdAt: '2026-10-24T18:00:00.000Z',
      },
      {
        id: 'tx-2',
        username: 's1mple_pro',
        type: 'SESSION_CHARGE',
        amount: -50.0,
        balanceBefore: 500.0,
        balanceAfter: 450.0,
        description: 'Оплата сесії на PC-02',
        createdAt: '2026-10-24T19:00:00.000Z',
      },
    ];
  }

  @Get('transactions/my')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Історія власних фінансових операцій клієнта' })
  getMyTransactions() {
    return [
      {
        id: 'tx-1',
        type: 'TOP_UP',
        amount: 500.0,
        description: 'Поповнення балансу',
        createdAt: '2026-10-24T18:00:00.000Z',
      },
    ];
  }
}
