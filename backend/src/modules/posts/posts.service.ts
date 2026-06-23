import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BaiViet } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(BaiViet)
    private readonly postRepository: Repository<BaiViet>,
  ) {}

  /**
   * Lấy danh sách bài viết đã PUBLISHED (Public API)
   * Hỗ trợ phân trang và tìm kiếm theo tiêu đề
   */
  async findPublished(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: BaiViet[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const whereCondition: any = { trangThai: 'PUBLISHED' };
    if (search) {
      whereCondition.tieuDe = Like(`%${search}%`);
    }

    const [data, total] = await this.postRepository.findAndCount({
      where: whereCondition,
      relations: ['tacGia'],
      order: { ngayTao: 'DESC' },
      skip,
      take: limit,
      select: {
        maBV: true,
        tieuDe: true,
        slug: true,
        tomTat: true,
        hinhAnh: true,
        luotXem: true,
        trangThai: true,
        ngayTao: true,
        ngayCapNhat: true,
        maND_TacGia: true,
        tacGia: {
          maND: true,
          hoTen: true,
          anhDaiDien: true,
        },
      },
    });

    return { data, total, page, limit };
  }

  /**
   * Lấy chi tiết bài viết theo Slug (Public API)
   * Tự động tăng LuotXem thêm 1
   */
  async findBySlug(slug: string): Promise<BaiViet> {
    const post = await this.postRepository.findOne({
      where: { slug, trangThai: 'PUBLISHED' },
      relations: ['tacGia'],
    });

    if (!post) {
      throw new NotFoundException(
        `Không tìm thấy bài viết với slug: "${slug}"`,
      );
    }

    await this.postRepository.increment({ maBV: post.maBV }, 'luotXem', 1);
    post.luotXem += 1;

    return post;
  }

  /**
   * Lấy tất cả bài viết (Admin API)
   */
  async findAll(): Promise<BaiViet[]> {
    return this.postRepository.find({
      relations: ['tacGia'],
      order: { ngayTao: 'DESC' },
      select: {
        maBV: true,
        tieuDe: true,
        slug: true,
        tomTat: true,
        hinhAnh: true,
        luotXem: true,
        trangThai: true,
        ngayTao: true,
        ngayCapNhat: true,
        maND_TacGia: true,
        tacGia: {
          maND: true,
          hoTen: true,
          anhDaiDien: true,
        },
      },
    });
  }

  /**
   * Lấy chi tiết bài viết theo ID (Admin API)
   */
  async findOneById(id: number): Promise<BaiViet> {
    const post = await this.postRepository.findOne({
      where: { maBV: id },
      relations: ['tacGia'],
    });

    if (!post) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    }

    return post;
  }

  /**
   * Tạo bài viết mới (Admin API)
   */
  async create(dto: CreatePostDto, authorId: number): Promise<BaiViet> {
    const existingSlug = await this.postRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Slug "${dto.slug}" đã tồn tại. Vui lòng chọn slug khác.`,
      );
    }

    const post = this.postRepository.create({
      tieuDe: dto.tieuDe,
      slug: dto.slug,
      tomTat: dto.tomTat,
      noiDung: dto.noiDung,
      hinhAnh: dto.hinhAnh,
      trangThai: dto.trangThai || 'DRAFT',
      maND_TacGia: authorId,
    });

    return this.postRepository.save(post);
  }

  /**
   * Cập nhật bài viết (Admin API)
   */
  async update(id: number, dto: UpdatePostDto): Promise<BaiViet> {
    const post = await this.findOneById(id);

    if (dto.slug && dto.slug !== post.slug) {
      const existingSlug = await this.postRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existingSlug && existingSlug.maBV !== id) {
        throw new ConflictException(
          `Slug "${dto.slug}" đã tồn tại. Vui lòng chọn slug khác.`,
        );
      }
    }

    Object.assign(post, {
      ...(dto.tieuDe !== undefined && { tieuDe: dto.tieuDe }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.tomTat !== undefined && { tomTat: dto.tomTat }),
      ...(dto.noiDung !== undefined && { noiDung: dto.noiDung }),
      ...(dto.hinhAnh !== undefined && { hinhAnh: dto.hinhAnh }),
      ...(dto.trangThai !== undefined && { trangThai: dto.trangThai }),
    });

    return this.postRepository.save(post);
  }

  /**
   * Xóa bài viết (Admin API)
   */
  async remove(id: number): Promise<void> {
    const post = await this.findOneById(id);
    await this.postRepository.remove(post);
  }
}
