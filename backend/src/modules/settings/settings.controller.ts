import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  @Get('public')
  @ApiOperation({ summary: 'Публічна інформація клубу для Landing Page' })
  getPublicSettings() {
    return {
      clubName: 'SENET Cyber Arena Kyiv',
      address: 'м. Київ, вул. Вадима Гетьмана, 1-Б',
      phone: '+380445550199',
      email: 'arena@senet-clone.local',
      workingHours: '24/7 (цілодобово)',
      currency: 'UAH',
      availablePcsCount: 10,
    };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Повні системні налаштування клубу (Owner)' })
  getSettings() {
    return {
      clubName: 'SENET Cyber Arena Kyiv',
      address: 'м. Київ, вул. Вадима Гетьмана, 1-Б',
      phone: '+380445550199',
      email: 'arena@senet-clone.local',
      workingHours: '24/7',
      currency: 'UAH',
      language: 'uk',
      lowBalanceThreshold: 20.0,
      autoCancelBookingMinutes: 15,
      allowNegativeBalance: false,
    };
  }

  @Patch()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Оновлення конфігурацій клубу (Owner)' })
  updateSettings(@Body() body: Record<string, any>) {
    return {
      message: 'Налаштування клубу успішно збережено',
      updatedSettings: body,
    };
  }
}
