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
import { ISearchProjects } from "../../types/FindFilteredProjects.interface";
import { OnEvent } from "@nestjs/event-emitter";
import { TransferSessionService } from "../../transfer-session/services/TransferSession.service";

interface IProjectSerice {
  create(data: ICreateProject): Promise<void>;
  findById(
    id: string,
    relations?: FindOptionsRelations<ProjectEntity>,
  ): Promise<ProjectEntity>;
  update(data: IUpdateProject): Promise<void>;
  delete(id: string): Promise<void>;
  publish(id: string): Promise<void>;
  search(data: ISearchProjects): Promise<ProjectEntity[]>;
  handleTransferTerminated(
    transferSessionId: string,
    failed: boolean,
  ): Promise<void>;
  handleTransferSuccess(transferSessionId: string): Promise<void>;
}

@Injectable()
export class ProjectService implements IProjectSerice {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>,
    private readonly categoryService: CategoryService,
    private readonly tagService: TagService,
    private readonly userService: UserService,
    private readonly transferSessionService: TransferSessionService,
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

    const res = await fetch(
      `https://api.github.com/repos/${owner.login}/${data.repositoryName}`,
    );

    if (!res.ok) throw new Error(`Github API error: ${res.status}`);

    const repository = await res.json();

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
      repositoryName: repository.name,
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

    const project = await this.findById(data.id);
    if (
      [ProjectStatusEnum.TRANSFERRING, ProjectStatusEnum.ADOPTED].includes(
        project.status,
      )
    )
      throw new BadRequestException(
        "No actions allowed while the project is being transfered, or if it's already adopted",
      );

    await this.repository.save({
      ...data,
      category,
      tags,
    });
  }

  async delete(id: string): Promise<void> {
    const project = await this.findById(id);
    if (
      [ProjectStatusEnum.TRANSFERRING, ProjectStatusEnum.ADOPTED].includes(
        project.status,
      )
    )
      throw new BadRequestException(
        "No actions allowed while the project is being transfered, or if it's already adopted",
      );

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

  async search(data: ISearchProjects): Promise<ProjectEntity[]> {
    const categorySlugs = data.categorySlugs ?? [];
    const tagSlugs = data.tagSlugs ?? [];

    const categories =
      typeof categorySlugs == "string"
        ? [await this.categoryService.findBySlug(categorySlugs)]
        : await Promise.all(
            categorySlugs.map((slug) => this.categoryService.findBySlug(slug)),
          );

    const tags =
      typeof tagSlugs == "string"
        ? [await this.tagService.findBySlug(tagSlugs)]
        : await Promise.all(
            tagSlugs.map((slug) => this.tagService.findBySlug(slug)),
          );

    const categoryIds = categories.map(({ id }) => id);
    const tagIds = tags.map(({ id }) => id);

    const query = this.repository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.category", "category")
      .leftJoinAndSelect("project.tags", "tag");

    if (categoryIds.length > 0) {
      query.andWhere("category.id IN (:...categoryIds)", {
        categoryIds,
      });
    }

    if (tagIds.length > 0) {
      query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("taggedProject.id")
          .from(ProjectEntity, "taggedProject")
          .innerJoin("taggedProject.tags", "matchedTag")
          .where("matchedTag.id IN (:...tagIds)")
          .groupBy("taggedProject.id")
          .having("COUNT(DISTINCT matchedTag.id) = :tagCount")
          .getQuery();

        return `project.id IN ${subQuery}`;
      });

      query.setParameters({
        tagIds,
        tagCount: tagIds.length,
      });
    }

    const searchWords =
      data.searchQuery?.trim().split(/\s+/).filter(Boolean) ?? [];

    for (const [index, word] of searchWords.entries()) {
      query.andWhere(`project.title ILIKE :searchWord${index}`, {
        [`searchWord${index}`]: `%${word}%`,
      });
    }

    const projects = await query
      .skip((Math.max(1, data.page) - 1) * 20)
      .take(20)
      .getMany();

    return projects;
  }

  @OnEvent("transfer.terminated")
  async handleTransferTerminated(
    transferSessionId: string,
    failed: boolean,
  ): Promise<void> {
    const transferSession = await this.transferSessionService.findById(
      transferSessionId,
      {
        project: true,
      },
    );
    const project = transferSession.project;

    if (failed) project.status = ProjectStatusEnum.DRAFT;
    else project.status = ProjectStatusEnum.PUBLISHED;

    await this.repository.save(project);
  }

  @OnEvent("transfer.success")
  async handleTransferSuccess(transferSessionId: string): Promise<void> {
    const transferSession = await this.transferSessionService.findById(
      transferSessionId,
      {
        project: true,
      },
    );
    const project = transferSession.project;

    project.status = ProjectStatusEnum.ADOPTED;

    await this.repository.save(project);
  }
}
