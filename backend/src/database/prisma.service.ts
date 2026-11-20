import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to PostgreSQL database');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        'PostgreSQL database server is not reachable at localhost:5432. Activating in-memory store for local development.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      try {
        await this.$disconnect();
        this.logger.log('Disconnected from PostgreSQL database');
      } catch {
        // Ignore disconnect error
      }
    }
  }
}
