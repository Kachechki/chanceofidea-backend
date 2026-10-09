import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ICreateCategoryOrTag } from "../../types/CreateCategoryOrTag.interface";
import { Repository } from "typeorm";
import { CategoryEntity } from "../entities/Category.entity";
import { InjectRepository } from "@nestjs/typeorm";

interface ICategoryService {
  create(data: ICreateCategoryOrTag): Promise<string>;
  findById(id: string): Promise<CategoryEntity>;
}

@Injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>,
  ) {}

  async create(data: ICreateCategoryOrTag): Promise<string> {
    const slug = data.name.toLowerCase().trim().replace(/\s+/g, "-");

    const existingCategory = await this.repository.findOneBy({ slug });
    if (existingCategory) throw new ConflictException("Category exists");

    return (
      await this.repository.save({
        name: data.name,
        slug,
      })
    ).id;
  }

  async findById(id: string): Promise<CategoryEntity> {
    const category = await this.repository.findOneBy({ id });
    if (!category) throw new NotFoundException("Category not found");

    return category;
  }
}
