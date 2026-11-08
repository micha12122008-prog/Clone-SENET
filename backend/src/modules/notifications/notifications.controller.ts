import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  @Get()
  @ApiOperation({ summary: 'Список сповіщень поточного користувача' })
  getNotifications() {
    return {
      unreadCount: 1,
      items: [
        {
          id: 'notif-1',
          type: 'LOW_BALANCE',
          title: 'Увага! Низький баланс',
          message: 'До закінчення оплаченого часу на PC-02 залишилося 10 хвилин. Поповніть баланс, щоб продовжити гру.',
          isRead: false,
          createdAt: '2026-10-24T19:50:00.000Z',
        },
        {
          id: 'notif-0',
          type: 'TOP_UP_SUCCESS',
          title: 'Баланс поповнено',
          message: 'Рахунок успішно поповнено на 500.00 грн.',
          isRead: true,
          createdAt: '2026-10-24T18:00:00.000Z',
        },
      ],
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Позначити сповіщення прочитаним' })
  markAsRead(@Param('id') id: string) {
    return { id, isRead: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Позначити всі сповіщення прочитаними' })
  readAll() {
    return { success: true, message: 'Усі сповіщення позначено прочитаними' };
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Масова розсилка акційного сповіщення для всіх гравців клубу (Owner)' })
  broadcast(@Body() body: { title: string; message: string }) {
    return {
      broadcastId: 'bc-1',
      sentToUsersCount: 28,
      title: body.title,
      message: 'Повідомлення успішно відправлено всім активним клієнтам',
    };
  }
}
