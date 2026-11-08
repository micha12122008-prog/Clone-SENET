import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  @Get('dashboard-summary')
  @ApiOperation({
    summary: 'Миттєве зведення для дашборда адміна (Тиждень 2: нулі або «немає даних», живі цифри з Т8)',
  })
  @ApiResponse({ status: 200, description: 'Каркас віджетів дашборда' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (потрібна роль ADMIN)' })
  getDashboardSummary() {
    return {
      workload: {
        currentPercent: 0,
        text: 'немає даних',
      },
      activeSessions: {
        count: 0,
        text: 'немає даних',
      },
      shiftRevenue: {
        amount: 0.0,
        currency: 'UAH',
        label: 'Виручка за поточну добу (зміна)',
        text: 'немає даних',
      },
      notifications: {
        unreadCount: 0,
        items: [],
        text: 'немає даних',
      },
      computers: {
        total: 0,
        free: 0,
        busy: 0,
        booked: 0,
        maintenance: 0,
        offline: 0,
      },
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Графік виручки за обраний період (доступно тільки для ADMIN)' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'custom'] })
  @ApiResponse({ status: 200, description: 'Дані виручки' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getRevenue(@Query('period') period = 'week') {
    return {
      period,
      totalRevenue: 0.0,
      chartData: [],
      status: 'немає даних',
    };
  }

  @Get('utilization')
  @ApiOperation({ summary: 'Коефіцієнт завантаженості ПК (%) та теплова карта пікових годин' })
  @ApiResponse({ status: 200, description: 'Дані завантаженості' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getUtilization() {
    return {
      averageUtilizationPercent: 0,
      peakHours: [],
      status: 'немає даних',
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'ТОП найпопулярніших тарифів та товарів бару' })
  @ApiResponse({ status: 200, description: 'Популярні тарифи та товари' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPopular() {
    return {
      topTariffs: [],
      topProducts: [],
      status: 'немає даних',
    };
  }
}
