import { Module } from '@nestjs/common';
import { UsersService } from './usuarios.service';
import { UsersRepository } from './usuarios.repository';
import { UsersController } from './usuarios.controller';
import { DatabaseModule } from '../../banco-dados/banco-dados.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}





