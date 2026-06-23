import { Module } from '@nestjs/common';
import { UsersService } from './pessoal.service';
import { UsersRepository } from './pessoal.repository';
import { UsersController } from './pessoal.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
