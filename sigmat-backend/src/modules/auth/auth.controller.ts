import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('autenticacao')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login-sei')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.loginCorporativo(body.usuario, body.senha);
  }

  @Get('debug-ping')
  async ping() {
    return { status: "Code Version: 1.0.1 - Debug Enabled", time: new Date().toISOString() };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    return this.authService.logout(req.user.id, token);
  }
}







