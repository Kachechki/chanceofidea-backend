import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ProjectService } from "../services/Project.service";

@Injectable()
export class ProjectGuard implements CanActivate {
  // This guard is only used in endpoints where you need to verify whether
  // the project you are interacting with is yours
  constructor(private readonly projectService: ProjectService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (!req.user) throw new InternalServerErrorException();

    const projectId = req.body ? req.body.id : req.query.id

    if (!projectId) throw new BadRequestException("No project ID provided");

    const project = await this.projectService.findById(projectId, {
      owner: true
    });

    if (project.owner.id == req.user.id) return true;

    return false
  }
}
