import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Миттєве зведення для головного екрана Dashboard' })
  getDashboardSummary() {
    return {
      computers: {
        total: 12,
        free: 10,
        busy: 1,
        booked: 0,
        maintenance: 1,
        offline: 0,
      },
      activeSessionsCount: 1,
      todayRevenue: 1250.0,
      revenueChangePercent: +14.5,
      todayClientsCount: 18,
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Графік виручки за обраний період (сесії vs бар)' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'custom'] })
  getRevenue(@Query('period') period = 'week') {
    return {
      period,
      totalRevenue: 24500.0,
      chartData: [
        { date: '2026-10-18', sessionsRevenue: 2800, storeRevenue: 600, total: 3400 },
        { date: '2026-10-19', sessionsRevenue: 2200, storeRevenue: 450, total: 2650 },
        { date: '2026-10-20', sessionsRevenue: 2600, storeRevenue: 520, total: 3120 },
        { date: '2026-10-21', sessionsRevenue: 3100, storeRevenue: 750, total: 3850 },
        { date: '2026-10-22', sessionsRevenue: 3900, storeRevenue: 980, total: 4880 },
        { date: '2026-10-23', sessionsRevenue: 4200, storeRevenue: 1100, total: 5300 },
        { date: '2026-10-24', sessionsRevenue: 3200, storeRevenue: 800, total: 4000 },
      ],
    };
  }

  @Get('utilization')
  @ApiOperation({ summary: 'Коефіцієнт завантаженості ПК (%) та теплова карта пікових годин' })
  getUtilization() {
    return {
      averageUtilizationPercent: 68.4,
      peakHours: [
        { hour: '16:00 - 18:00', loadPercent: 78.0 },
        { hour: '18:00 - 22:00', loadPercent: 94.5 },
        { hour: '22:00 - 02:00', loadPercent: 82.0 },
      ],
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'ТОП найпопулярніших тарифів та товарів бару' })
  getPopular() {
    return {
      topTariffs: [
        { name: '3 Години Пакет', usesCount: 84, revenue: 10920.0 },
        { name: '1 Година Standard', usesCount: 65, revenue: 3250.0 },
        { name: 'Ніч у Клубі', usesCount: 32, revenue: 8960.0 },
      ],
      topProducts: [
        { name: 'Monster Energy Ultra White', salesCount: 52, revenue: 3380.0 },
        { name: 'Чипси Lay’s 120г', salesCount: 38, revenue: 1710.0 },
      ],
    };
  }
}
