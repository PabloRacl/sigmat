import { Module } from '@nestjs/common';
import { SettingsService } from './configuracoes.service';
import { SettingsController } from './configuracoes.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}





