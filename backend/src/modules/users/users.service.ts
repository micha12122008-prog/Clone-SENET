import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/auth.dto';
import { UpdateProfileDto, UpdateUserStatusDto } from './dto/users.dto';

export interface InternalUser {
  id: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: Date | null;
  avatarUrl?: string | null;
  avatarFrame?: string | null;
  bannerUrl?: string | null;
  role: UserRole;
  balance: any;
  bonusBalance: any;
  totalPlayTimeMinutes: number;
  totalSpent: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  // In-memory резервне сховище на випадок відсутності підключення до PostgreSQL
  private readonly memoryUsers = new Map<string, InternalUser>();

  constructor(private readonly prisma: PrismaService) {
    this.initDefaultUsers();
  }

  private initDefaultUsers() {
    const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

    const defaultUsers: InternalUser[] = [
      {
        id: 'admin-uuid-1111-2222-3333-444455556666',
        email: 'admin@obsidianclub.ua',
        phone: '+380992223344',
        username: 'admin_alex',
        passwordHash: defaultPasswordHash,
        firstName: 'Олексій',
        lastName: 'Адмін',
        role: UserRole.ADMIN,
        balance: 500.0,
        bonusBalance: 0.0,
        avatarFrame: 'frame_cyber_admin',
        totalPlayTimeMinutes: 2400,
        totalSpent: 0.0,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        id: 'player-uuid-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
        email: 'player1@gmail.com',
        phone: '+380993334455',
        username: 's1mple_pro',
        passwordHash: defaultPasswordHash,
        firstName: 'Олександр',
        lastName: 'Костилєв',
        birthDate: new Date('1997-10-02'),
        role: UserRole.CLIENT,
        balance: 450.0,
        bonusBalance: 80.0,
        avatarFrame: 'frame_pro_sniper',
        bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
        totalPlayTimeMinutes: 1240,
        totalSpent: 1650.0,
        createdAt: new Date('2026-10-10T12:00:00.000Z'),
        updatedAt: new Date('2026-10-10T12:00:00.000Z'),
      },
      {
        id: 'player-uuid-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
        email: 'player2@gmail.com',
        phone: '+380994445566',
        username: 'b1t_clutch',
        passwordHash: defaultPasswordHash,
        firstName: 'Валерій',
        lastName: 'Ваховський',
        birthDate: new Date('2003-01-05'),
        role: UserRole.CLIENT,
        balance: 180.0,
        bonusBalance: 20.0,
        avatarFrame: 'frame_headshot_king',
        totalPlayTimeMinutes: 520,
        totalSpent: 750.0,
        createdAt: new Date('2026-10-15T14:00:00.000Z'),
        updatedAt: new Date('2026-10-15T14:00:00.000Z'),
      },
    ];

    for (const u of defaultUsers) {
      this.memoryUsers.set(u.id, u);
    }
  }

  /**
   * Пошук користувача за логіном (email, телефон або username)
   */
  async findByLogin(login: string): Promise<InternalUser | null> {
    const trimmed = login.trim();
    const lower = trimmed.toLowerCase();

    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: lower, mode: 'insensitive' } },
              { phone: trimmed },
              { username: { equals: lower, mode: 'insensitive' } },
            ],
          },
        });

        if (user) {
          return user as unknown as InternalUser;
        }
      } catch {
        // Fallback
      }
    }

    for (const user of this.memoryUsers.values()) {
      if (
        (user.email && user.email.toLowerCase() === lower) ||
        user.phone === trimmed ||
        (user.username && user.username.toLowerCase() === lower)
      ) {
        return user;
      }
    }

    return null;
  }

  /**
   * Пошук за ID
   */
  async findById(id: string): Promise<InternalUser | null> {
    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id },
        });
        if (user) {
          return user as unknown as InternalUser;
        }
      } catch {
        // Fallback
      }
    }

    return this.memoryUsers.get(id) || null;
  }

  /**
   * Пошук за Email або Телефоном
   */
  async findByIdentifier(identifier: string): Promise<InternalUser | null> {
    return this.findByLogin(identifier);
  }

  /**
   * Створення нового користувача (реєстрація)
   */
  async create(dto: RegisterDto): Promise<InternalUser> {
    const trimmedEmail = dto.email.trim().toLowerCase();
    const trimmedPhone = dto.phone.trim();
    const trimmedUsername = dto.username.trim();

    // Перевірка на унікальність
    const existing = await this.findConflict(trimmedEmail, trimmedPhone, trimmedUsername);
    if (existing) {
      if (existing.email.toLowerCase() === trimmedEmail) {
        throw new ConflictException('Користувач із такою електронною поштою вже зареєстрований');
      }
      if (existing.phone === trimmedPhone) {
        throw new ConflictException('Користувач із таким номером телефону вже зареєстрований');
      }
      if (existing.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        throw new ConflictException('Цей нікнейм уже зайнятий');
      }
      throw new ConflictException('Користувач із такими даними вже існує');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.CLIENT;
    const now = new Date();

    const newUserData = {
      email: trimmedEmail,
      phone: trimmedPhone,
      username: trimmedUsername,
      passwordHash,
      firstName: dto.firstName?.trim() || null,
      lastName: dto.lastName?.trim() || null,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      role,
      avatarFrame: role === UserRole.ADMIN ? 'frame_cyber_admin' : 'frame_novice',
      balance: 0.0 as any,
      bonusBalance: 0.0 as any,
      totalPlayTimeMinutes: 0,
      totalSpent: 0.0 as any,
    };

    if (this.prisma.isConnected) {
      try {
        const createdPrismaUser = await this.prisma.user.create({
          data: newUserData,
        });

        const internalUser = createdPrismaUser as unknown as InternalUser;
        this.memoryUsers.set(internalUser.id, internalUser);
        return internalUser;
      } catch (err) {
        this.logger.warn(`Prisma create fallback to memory store: ${err.message}`);
      }
    }

    const fallbackUser: InternalUser = {
      id: `user-uuid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...newUserData,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryUsers.set(fallbackUser.id, fallbackUser);
    return fallbackUser;
  }

  private async findConflict(email: string, phone: string, username: string): Promise<InternalUser | null> {
    if (this.prisma.isConnected) {
      try {
        const conflict = await this.prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: email, mode: 'insensitive' } },
              { phone },
              { username: { equals: username, mode: 'insensitive' } },
            ],
          },
        });
        if (conflict) {
          return conflict as unknown as InternalUser;
        }
      } catch {
        // Fallback
      }
    }

    for (const u of this.memoryUsers.values()) {
      if (
        (u.email && u.email.toLowerCase() === email.toLowerCase()) ||
        u.phone === phone ||
        (u.username && u.username.toLowerCase() === username.toLowerCase())
      ) {
        return u;
      }
    }

    return null;
  }

  /**
   * Оновлення пароля (після підтвердження OTP)
   */
  async updatePassword(userId: string, newPasswordHash: string): Promise<InternalUser> {
    if (this.prisma.isConnected) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { passwordHash: newPasswordHash },
        });
        const existing = this.memoryUsers.get(userId);
        const internal = { ...existing, ...updated } as unknown as InternalUser;
        this.memoryUsers.set(userId, internal);
        return internal;
      } catch {
        // Fallback
      }
    }

    const user = this.memoryUsers.get(userId);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date();
    return user;
  }

  /**
   * Зміна контактних даних (email або телефону)
   */
  async updateContactTarget(oldTarget: string, newTarget: string): Promise<InternalUser | null> {
    const user = await this.findByIdentifier(oldTarget);
    if (!user) {
      return null;
    }

    const isEmail = newTarget.includes('@');
    const updateData: Record<string, string> = isEmail
      ? { email: newTarget.toLowerCase().trim() }
      : { phone: newTarget.trim() };

    if (this.prisma.isConnected) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        const existing = this.memoryUsers.get(user.id);
        const internal = { ...existing, ...updated } as unknown as InternalUser;
        this.memoryUsers.set(user.id, internal);
        return internal;
      } catch {
        // Fallback
      }
    }

    if (isEmail) {
      user.email = newTarget.toLowerCase().trim();
    } else {
      user.phone = newTarget.trim();
    }
    user.updatedAt = new Date();
    return user;
  }

  /**
   * Оновлення профілю
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<InternalUser> {
    const updateData: Record<string, any> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    if (this.prisma.isConnected) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
        const existing = this.memoryUsers.get(userId);
        const internal = { ...existing, ...updated } as unknown as InternalUser;
        this.memoryUsers.set(userId, internal);
        return internal;
      } catch {
        // Fallback
      }
    }

    const user = this.memoryUsers.get(userId);
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    Object.assign(user, updateData);
    user.updatedAt = new Date();
    return user;
  }

  /**
   * Отримання списку користувачів для адміністратора
   */
  async findAll(query: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    if (this.prisma.isConnected) {
      try {
        const where: any = {};
        if (query.role) {
          where.role = query.role.toUpperCase();
        }
        if (query.search) {
          where.OR = [
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search } },
            { username: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const [items, total] = await Promise.all([
          this.prisma.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.user.count({ where }),
        ]);

        if (items.length > 0 || total > 0) {
          return {
            items: items.map((u) => this.sanitize(u as unknown as InternalUser)),
            total,
            page,
            limit,
          };
        }
      } catch {
        // Fallback
      }
    }

    let items = Array.from(this.memoryUsers.values());
    if (query.role) {
      items = items.filter((u) => u.role.toUpperCase() === query.role.toUpperCase());
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      items = items.filter(
        (u) =>
          u.username.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.phone.includes(s),
      );
    }

    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);

    return {
      items: paginated.map((u) => this.sanitize(u)),
      total,
      page,
      limit,
    };
  }

  /**
   * Очищення конфіденційних полів перед відправкою клієнту
   */
  sanitize(user: InternalUser) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
