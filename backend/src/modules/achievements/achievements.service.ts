import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAchievementDto, EquipFrameDto } from './dto/achievements.dto';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.achievement.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMyAchievements(userId: string) {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    const allAchievements = await this.prisma.achievement.findMany();

    const unlockedMap = new Set(userAchievements.map((ua) => ua.achievementId));

    return allAchievements.map((ach) => ({
      ...ach,
      isUnlocked: unlockedMap.has(ach.id),
      unlockedAt: userAchievements.find((ua) => ua.achievementId === ach.id)?.unlockedAt || null,
    }));
  }

  async create(dto: CreateAchievementDto) {
    return this.prisma.achievement.create({
      data: dto,
    });
  }

  async equipFrame(userId: string, dto: EquipFrameDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarFrame: dto.frameCode },
      select: {
        id: true,
        username: true,
        avatarFrame: true,
      },
    });
  }
}
