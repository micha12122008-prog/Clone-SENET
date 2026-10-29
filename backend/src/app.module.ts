import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ZonesModule } from './modules/zones/zones.module';
import { ComputersModule } from './modules/computers/computers.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StoreModule } from './modules/store/store.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { AchievementsModule } from './modules/achievements/achievements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ZonesModule,
    ComputersModule,
    TariffsModule,
    BookingsModule,
    SessionsModule,
    PaymentsModule,
    StoreModule,
    AnalyticsModule,
    NotificationsModule,
    SettingsModule,
    TournamentsModule,
    AchievementsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
