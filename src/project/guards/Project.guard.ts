import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { ProjectService } from "../services/Project.service";

export class ProjectGuard implements CanActivate {
  // This guard is only used in endpoints where you need to verify whether
  // the project you are interacting with is yours
  constructor(private readonly projectService: ProjectService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (!req.user) throw new InternalServerErrorException();

    if (!req.body.id) throw new BadRequestException();

    const project = await this.projectService.findById(req.body.id, {
      owner: true,
    });

    if (project.owner.id == req.user.id) return true;

    return false
  }
}
