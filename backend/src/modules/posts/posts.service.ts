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
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(BaiViet)
    private readonly postRepository: Repository<BaiViet>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Lấy danh sách bài viết đã PUBLISHED (Public API)
   * Hỗ trợ phân trang và tìm kiếm theo tiêu đề
   */
  async findPublished(
    page: number = 1,
    limit: number = 10,
    search?: string,
    maDMBV?: number,
    sortBy?: string,
  ): Promise<{ data: BaiViet[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const whereCondition: any = { trangThai: 'PUBLISHED' };
    if (search) {
      whereCondition.tieuDe = Like(`%${search}%`);
    }
    if (maDMBV) {
      whereCondition.maDMBV = maDMBV;
    }

    let orderCondition: any = { isPinned: 'DESC', ngayTao: 'DESC' };
    if (sortBy === 'oldest') {
      orderCondition = { isPinned: 'DESC', ngayTao: 'ASC' };
    } else if (sortBy === 'views') {
      orderCondition = { isPinned: 'DESC', luotXem: 'DESC' };
    } else if (sortBy === 'a-z') {
      orderCondition = { isPinned: 'DESC', tieuDe: 'ASC' };
    } else if (sortBy === 'z-a') {
      orderCondition = { isPinned: 'DESC', tieuDe: 'DESC' };
    }

    const [data, total] = await this.postRepository.findAndCount({
      where: whereCondition,
      relations: ['tacGia', 'category'],
      order: orderCondition,
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
        authorId: true,
        maDMBV: true,
        category: {
          maDMBV: true,
          tenDMBV: true,
          slug: true,
        },
        isPinned: true,
        tacGia: {
          maND: true,
          hoTen: true,
          anhDaiDien: true,
        },
      },
    });

    return { data, total, page, limit };
  }

  private viewCache = new Map<string, number>();

  /**
   * Lấy chi tiết bài viết theo Slug (Public API)
   * Tự động tăng LuotXem thêm 1 (có debounce 2 giây)
   */
  async findBySlug(slug: string): Promise<BaiViet> {
    const post = await this.postRepository.findOne({
      where: { slug, trangThai: 'PUBLISHED' },
      relations: ['tacGia', 'category'],
    });

    if (!post) {
      throw new NotFoundException(
        `Không tìm thấy bài viết với slug: "${slug}"`,
      );
    }
    
    const now = Date.now();
    const lastView = this.viewCache.get(slug) || 0;
    
    // Chỉ tăng lượt xem nếu cách lần cuối cùng >= 2 giây (Chống spam/React StrictMode)
    if (now - lastView > 2000) {
      this.viewCache.set(slug, now);
      await this.postRepository.increment({ maBV: post.maBV }, 'luotXem', 1);
      post.luotXem += 1;
    }

    return post;
  }

  /**
   * Lấy tất cả bài viết (Admin API)
   */
  async findAll(): Promise<BaiViet[]> {
    return this.postRepository.find({
      relations: ['tacGia', 'category'],
      order: { isPinned: 'DESC', ngayTao: 'DESC' },
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
        authorId: true,
        maDMBV: true,
        category: {
          maDMBV: true,
          tenDMBV: true,
          slug: true,
        },
        isPinned: true,
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
      relations: ['tacGia', 'category'],
    });

    if (!post) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    }

    return post;
  }

  async findPublishedById(id: number): Promise<BaiViet> {
    const post = await this.postRepository.findOne({
      where: { maBV: id, trangThai: 'PUBLISHED' },
      relations: ['tacGia', 'category'],
    });

    if (!post) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    }

    await this.postRepository.increment({ maBV: post.maBV }, 'luotXem', 1);
    post.luotXem += 1;
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
      authorId,
      maDMBV: dto.maDMBV ?? 1,
      isPinned: dto.isPinned ?? false,
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
      ...(dto.maDMBV !== undefined && { maDMBV: dto.maDMBV, category: { maDMBV: dto.maDMBV } as any }),
      ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
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

  async notifySave(postId: number, userId: number, isSaving: boolean) {
    if (!isSaving) return; 
    
    const post = await this.postRepository.findOne({ where: { maBV: postId } });
    if (!post) return;

    let previewContent = post.tieuDe.substring(0, 50);
    if (post.tieuDe.length > 50) previewContent += '...';

    await this.notificationsService.createNotification({
      maND: userId, // Gửi cho chính người vừa lưu
      maNguoiGui: null,
      loaiThongBao: NotificationType.INTERACTION,
      tieuDe: `Bạn đã lưu bài viết: ${previewContent}`,
      noiDung: `Bài viết "${post.tieuDe}" đã được thêm vào danh sách đã lưu của bạn.|||/blog/${post.slug}`,
    });
  }
}
