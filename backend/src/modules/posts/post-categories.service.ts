import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostCategory } from './entities/post-category.entity';
import { CreatePostCategoryDto, UpdatePostCategoryDto } from './dto/post-category.dto';

@Injectable()
export class PostCategoriesService {
  constructor(
    @InjectRepository(PostCategory)
    private readonly postCategoryRepository: Repository<PostCategory>,
  ) {}

  async findAll(): Promise<PostCategory[]> {
    return this.postCategoryRepository.find({
      order: { maDMBV: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PostCategory> {
    const category = await this.postCategoryRepository.findOne({ where: { maDMBV: id } });
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục bài viết với ID: ${id}`);
    }
    return category;
  }

  async create(dto: CreatePostCategoryDto): Promise<PostCategory> {
    const existing = await this.postCategoryRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" đã tồn tại.`);
    }

    const category = this.postCategoryRepository.create(dto);
    return this.postCategoryRepository.save(category);
  }

  async update(id: number, dto: UpdatePostCategoryDto): Promise<PostCategory> {
    const category = await this.findOne(id);

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.postCategoryRepository.findOne({ where: { slug: dto.slug } });
      if (existing && existing.maDMBV !== id) {
        throw new ConflictException(`Slug "${dto.slug}" đã tồn tại.`);
      }
    }

    Object.assign(category, dto);
    return this.postCategoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.postCategoryRepository.remove(category);
  }
}
