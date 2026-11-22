import { Module } from '@nestjs/common';
import { ZonesModule } from '../zones/zones.module';
import { ComputersController } from './computers.controller';
import { ComputersService } from './computers.service';
import { RepairsController } from './repairs.controller';

@Module({
  imports: [ZonesModule],
  controllers: [ComputersController, RepairsController],
  providers: [ComputersService],
  exports: [ComputersService],
})
export class ComputersModule {}
