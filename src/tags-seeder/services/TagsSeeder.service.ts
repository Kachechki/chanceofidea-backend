import { ConflictException, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { TagService } from "../../tag/services/Tag.service";

const DEFAULT_TAGS = [
  "Python",
  "Java",
  "Rust",
  "Go",
  "TypeScript",
  "JavaScript",
  "Web",
  "C++",
  "C",
  "PHP",
  "C#",
  "React",
  "Vue.js",
  "Node.js",
  "Next.js",
  "FastAPI",
  "Flask",
  "DJango",
  "Docker",
  "Nest.js",
];

@Injectable()
export class TagsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TagsSeederService.name);

  constructor(private readonly tagService: TagService) {}

  async onApplicationBootstrap() {
    for (const tag of DEFAULT_TAGS) {
      try {
        await this.tagService.create({ name: tag });
        this.logger.log(`Created tag ${tag}`);
      } catch (error) {
        if (error instanceof ConflictException) {
          this.logger.log(`Skipped tag ${tag}`);
          continue;
        }

        throw error;
      }
    }
  }
}
