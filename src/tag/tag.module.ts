import { Module } from '@nestjs/common';
import { TagService } from './services/Tag.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from './entities/Tag.entity';
import { TagController } from './tag.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([TagEntity]), AuthModule],
    providers: [TagService],
    exports: [TagService],
    controllers: [TagController]
})
export class TagModule {}
