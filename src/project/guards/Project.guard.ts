import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ProjectService } from "../services/Project.service";
import { RedisCacheService } from "../../redis-cache/services/RedisCache.service";

@Injectable()
export class ProjectGuard implements CanActivate {
  // This guard is only used in endpoints where you need to verify whether
  // the project you are interacting with is yours
  constructor(
    private readonly projectService: ProjectService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (!req.user) throw new InternalServerErrorException();

    const projectId = req.body?.projectId ?? req.query.projectId;

    if (!projectId) throw new BadRequestException("No project ID provided");

    // Try to find project in cache first
    const owner2project = await this.redisCacheService.get(projectId);

    if (req.user.id == owner2project) return true;
    else {
      const project = await this.projectService.findById(projectId, {
        owner: true,
      });

      if (project.owner.id == req.user.id) {
        await this.redisCacheService.set(project.id, req.user.id, 1000 * 60 * 2);

        return true;
      }
    }
    return false;
  }
}
