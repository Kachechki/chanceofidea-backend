import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/Auth.service';
import { UserModule } from '../user/user.module';
import { HashService } from './services/Hash.service';
import { JwtTokenService } from './services/Jwt.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [forwardRef(() => UserModule), JwtModule],
  controllers: [AuthController],
  providers: [AuthService, HashService, JwtTokenService],
  exports: [JwtTokenService]
})
export class AuthModule {}
