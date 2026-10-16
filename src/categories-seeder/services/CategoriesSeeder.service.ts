import { ConflictException, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { CategoryService } from "../../category/services/Category.sevice";

const DEFAULT_CATEGORIES = [
  "All Categories",
  "Frontend",
  "Backend",
  "Fullstack",
  "Telegram bot",
  "Artificial Intelligence and Machine Learning",
  "Mobile Development",
  "Desktop Software Development",
  "Cybersecurity",
  "Game Development",
  "Design and UI/UX",
  "Other",
];

@Injectable()
export class CategoriesSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesSeederService.name);

  constructor(private readonly categoryService: CategoryService) {}

  async onApplicationBootstrap() {
    for (const category of DEFAULT_CATEGORIES) {
      try {
        await this.categoryService.create({ name: category });
        this.logger.log(`Created category ${category}`);
      } catch (error) {
        if (error instanceof ConflictException) {
          this.logger.log(`Skipped category ${category}`);
          continue;
        }

        throw error;
      }
    }
  }
}
