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
import { UserService } from "../../user/services/User.service";
import { IFindFilteredProjects } from "../../types/FindFilteredProjects.interface";

interface IProjectSerice {
  create(data: ICreateProject): Promise<void>;
  findById(
    id: string,
    relations?: FindOptionsRelations<ProjectEntity>,
  ): Promise<ProjectEntity>;
  update(data: IUpdateProject): Promise<void>;
  delete(id: string): Promise<void>;
  publish(id: string): Promise<void>;
  findFiltered(data: IFindFilteredProjects): Promise<ProjectEntity[]>;
}

@Injectable()
export class ProjectService implements IProjectSerice {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>,
    private readonly categoryService: CategoryService,
    private readonly tagService: TagService,
    private readonly userService: UserService,
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

    const owner = await this.userService.findById(data.ownerId);

    await this.repository.save({
      ...data,
      categoryName: undefined,
      tagNames: undefined,
      category,
      tags,
      status: data.publish
        ? ProjectStatusEnum.PUBLISHED
        : ProjectStatusEnum.DRAFT,
      createdAt: new Date(),
      owner,
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
    if (!project) throw new NotFoundException("Project not found");

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
      ...data,
      category,
      tags,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async publish(id: string): Promise<void> {
    const project = await this.findById(id);

    if (
      [ProjectStatusEnum.DRAFT, ProjectStatusEnum.PUBLISHED].includes(
        project.status,
      )
    )
      project.status = ProjectStatusEnum.PUBLISHED;
    else throw new BadRequestException("Invalid current project state");

    await this.repository.save(project);
  }

  async findFiltered(data: IFindFilteredProjects): Promise<ProjectEntity[]> {
    const categories = await Promise.all(
      data.categorySlugs.map((slug) => this.categoryService.findBySlug(slug)),
    );

    const tags = await Promise.all(
      data.tagSlugs.map((slug) => this.tagService.findBySlug(slug))
    )

    const projects = await this.repository.find({
      where: {
        category: categories,
        tags
      },
      skip: data.page * 20,
      take: 20
    }) 

    return projects
  }
}
