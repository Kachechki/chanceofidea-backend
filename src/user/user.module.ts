import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./services/User.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./entities/User.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
