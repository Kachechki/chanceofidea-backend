import { Repository } from "typeorm";
import { ICreateCategoryOrTag } from "../../types/CreateCategoryOrTag.interface";
import { TagEntity } from "../entities/Tag.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";

interface ITagService {
  create(data: ICreateCategoryOrTag): Promise<string>;
  findById(id: string): Promise<TagEntity>;
}

export class TagService implements ITagService {
  constructor(
    @InjectRepository(TagEntity)
    private readonly repository: Repository<TagEntity>,
  ) {}

  async create(data: ICreateCategoryOrTag): Promise<string> {
    const slug = data.name.toLowerCase().trim().replace(/\s+/g, "-");

    const existingTag = await this.repository.findOneBy({ slug });
    if (existingTag) throw new ConflictException("Tag exists");

    return (await this.repository.save({ name: data.name, slug })).id;
  }

  async findById(id: string): Promise<TagEntity> {
    const tag = await this.repository.findOneBy({ id });
    if (!tag) throw new NotFoundException("Tag not found");

    return tag;
  }
}
