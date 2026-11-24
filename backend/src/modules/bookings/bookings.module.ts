import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { UsersModule } from '../users/users.module';
import { ComputersModule } from '../computers/computers.module';
import { TariffsModule } from '../tariffs/tariffs.module';
import { ZonesModule } from '../zones/zones.module';

@Module({
  imports: [UsersModule, ComputersModule, TariffsModule, ZonesModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
