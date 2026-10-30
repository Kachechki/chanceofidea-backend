import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ProjectService } from "../services/Project.service";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class ProjectGuard implements CanActivate {
  // This guard is only used in endpoints where you need to verify whether
  // the project you are interacting with is yours
  constructor(
    private readonly projectService: ProjectService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (!req.user) throw new InternalServerErrorException();

    const projectId = req.body?.projectId ?? req.query.projectId;

    if (!projectId) throw new BadRequestException("No project ID provided");

    // Try to find project in cache first
    const owner2project = await this.cacheManager.get(projectId);

    if (req.user.id == owner2project) return true;
    else {
      const project = await this.projectService.findById(projectId, {
        owner: true,
      });

      if (project.owner.id == req.user.id) {
        await this.cacheManager.set(project.id, req.user.id, 1000 * 60 * 2);

        return true;
      }
    }
    return false;
  }
}
