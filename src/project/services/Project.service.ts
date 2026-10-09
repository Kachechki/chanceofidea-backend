import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ICreateProject } from "../../types/CreateProject.interface";
import { FindOptionsRelations, Repository } from "typeorm";
import { ProjectEntity } from "../entities/Project.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CategoryService } from "../../category/services/Category.sevice";
import { TagService } from "../../tag/services/Tag.service";
import { IUpdateProject } from "../../types/UpdateProject.interface";
import { ProjectStatusEnum } from "../../enums/ProjectStatus.enum";

interface IProjectSerice {
  create(data: ICreateProject): Promise<void>;
  findById(
    id: string,
    relations?: FindOptionsRelations<ProjectEntity>,
  ): Promise<ProjectEntity>;
  update(data: IUpdateProject): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class ProjectService implements IProjectSerice {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>,
    private readonly categoryService: CategoryService,
    private readonly tagService: TagService,
  ) {}

  async create(data: ICreateProject): Promise<void> {
    const category = await this.categoryService.findById(data.categoryId);

    const tags = [];

    for (const tag of data.tags) {
      const tagId = await this.tagService.findById(tag);
      tags.push(tagId);
    }

    if (tags.length == 0)
      throw new BadRequestException("No project tags provided");

    await this.repository.save({
      ...data,
      categoryName: undefined,
      tagNames: undefined,
      category,
      tags,
      status: data.publish
        ? ProjectStatusEnum.PUBLISHED
        : ProjectStatusEnum.DRAFT,
    });
  }

  async findById(
    id: string,
    relations?: FindOptionsRelations<ProjectEntity>,
  ): Promise<ProjectEntity> {
    const project = await this.repository.findOne({
      where: {
        id,
      },
      relations,
    });
    if (!project) throw new NotFoundException("Project not foud");

    return project;
  }

  async update(data: IUpdateProject): Promise<void> {
    const category = data.category
      ? await this.categoryService.findById(data.category)
      : undefined;
    const tags = data.tags
      ? await Promise.all(data.tags.map((tag) => this.tagService.findById(tag)))
      : undefined;

    await this.repository.save({
      id: data.id,
      category,
      description: data.description,
      readiness: data.readiness,
      tags,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
