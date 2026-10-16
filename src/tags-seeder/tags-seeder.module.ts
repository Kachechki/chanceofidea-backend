import { Module } from "@nestjs/common";
import { TagsSeederService } from "./services/TagsSeeder.service";
import { TagModule } from "../tag/tag.module";

@Module({
  imports: [TagModule],
  providers: [TagsSeederService],
})
export class TagsSeederModule {}
