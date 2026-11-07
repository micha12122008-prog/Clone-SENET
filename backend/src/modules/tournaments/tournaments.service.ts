import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTournamentDto, RegisterTournamentDto, UpdateMatchScoreDto } from './dto/tournaments.dto';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(game?: string, status?: string) {
    const where: any = {};
    if (game) where.game = game;
    if (status) where.status = status;

    return this.prisma.tournament.findMany({
      where,
      include: {
        _count: {
          select: { applications: true, matches: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                avatarFrame: true,
              },
            },
          },
        },
        matches: {
          orderBy: [{ orderIndex: 'asc' }],
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(`Турнір з ID ${id} не знайдено`);
    }

    return tournament;
  }

  async create(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        title: dto.title,
        game: dto.game as any,
        format: dto.format as any,
        prizePool: dto.prizePool,
        entryFee: dto.entryFee,
        maxSlots: dto.maxParticipants,
        startTime: new Date(dto.startTime),
        streamUrl: dto.streamUrl,
      },
    });
  }

  async register(id: string, userId: string, dto: RegisterTournamentDto) {
    const tournament = await this.findOne(id);

    const application = await this.prisma.tournamentApplication.create({
      data: {
        tournamentId: id,
        userId,
        teamName: dto.teamName,
        teamMembers: dto.teamMembers || [],
      },
    });

    return {
      message: 'Заявку на турнір успішно зареєстровано',
      application,
    };
  }

  async updateMatch(id: string, matchId: string, dto: UpdateMatchScoreDto) {
    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        score1: dto.score1,
        score2: dto.score2,
        winnerName: dto.winnerId,
      },
    });
  }
}
