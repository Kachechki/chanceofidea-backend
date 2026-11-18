import { Module } from '@nestjs/common';
import { AppealController } from './appeal.controller';

@Module({
  controllers: [AppealController]
})
export class AppealModule {}
