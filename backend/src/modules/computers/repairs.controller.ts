import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ComputersService } from './computers.service';
import { CreateRepairDto, FinishRepairDto, RepairResponseDto } from './dto/computers.dto';

@ApiTags('Maintenance (Ремонт)')
@Controller('repairs')
export class RepairsController {
  constructor(private readonly computersService: ComputersService) {}

  @Get()
  @ApiOperation({
    summary: 'Отримати журнал ремонтів клубу',
    description: 'Повертає історію ремонтів із причиною, датою початку та статусом виконання.',
  })
  @ApiQuery({ name: 'placeId', required: false, description: 'ID конкретного комп’ютера' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Лише незавершені ремонти' })
  @ApiResponse({ status: 200, description: 'Список записів журналу ремонту', type: [RepairResponseDto] })
  async getRepairs(
    @Query('placeId') placeId?: string,
    @Query('activeOnly') activeOnly?: boolean,
  ) {
    return this.computersService.findAllRepairs({ placeId, activeOnly });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Створити запис про ремонт та перевести ПК у статус "ремонт" (лише ADMIN)',
  })
  @ApiResponse({ status: 201, description: 'Запис успішно створено', type: RepairResponseDto })
  @ApiResponse({ status: 400, description: 'Некоректні дані' })
  @ApiResponse({ status: 401, description: 'Неавторизовано' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  async createRepair(@Body() dto: CreateRepairDto) {
    return this.computersService.createRepair(dto);
  }

  @Patch(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Завершити ремонт та повернути ПК у статус "вільно" (лише ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID запису ремонту' })
  @ApiResponse({ status: 200, description: 'Ремонт успішно завершено' })
  @ApiResponse({ status: 401, description: 'Неавторизовано' })
  @ApiResponse({ status: 403, description: 'Недостатньо прав (потрібна роль ADMIN)' })
  @ApiResponse({ status: 404, description: 'Запис ремонту не знайдено' })
  async finishRepair(
    @Param('id') id: string,
    @Body() dto: FinishRepairDto,
  ) {
    return this.computersService.finishRepair(id, dto);
  }
}
