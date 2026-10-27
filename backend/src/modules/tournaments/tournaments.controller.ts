import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTournamentDto, RegisterTournamentDto, UpdateMatchScoreDto } from './dto/tournaments.dto';
import { TournamentsService } from './tournaments.service';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'Список турнірів клубу (анонси, активні LIVE, минулі)' })
  @ApiQuery({ name: 'game', required: false, enum: ['CS2', 'DOTA2', 'VALORANT', 'FIFA'] })
  @ApiQuery({ name: 'status', required: false, enum: ['REGISTRATION_OPEN', 'LIVE', 'COMPLETED'] })
  findAll(@Query('game') game?: string, @Query('status') status?: string) {
    return this.tournamentsService.findAll(game, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детальна інформація про турнір, інтерактивна сітка (Bracket) та список учасників' })
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Створення нового турніру (для адміністратора клубу)' })
  @ApiResponse({ status: 201, description: 'Турнір успішно створено' })
  create(@Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(dto);
  }

  @Post(':id/register')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Подати заявку на участь у турнірі (соло або команда 5х5)' })
  register(@Param('id') id: string, @Body() dto: RegisterTournamentDto) {
    // Для моку або поточного гравця використовуємо тестовий ID s1mple
    const defaultUserId = 'current-user-uuid';
    return this.tournamentsService.register(id, defaultUserId, dto);
  }

  @Patch(':id/matches/:matchId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Оновлення результатів матчу в турнірній сітці (рахунок, статус, переможець)' })
  updateMatch(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchScoreDto,
  ) {
    return this.tournamentsService.updateMatch(id, matchId, dto);
  }
}
