import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { KhoaHoc } from '../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getCoursesByInstructor(instructorId: number) {
    return await this.khoaHocRepository.find({
      where: { maND_GiangVien: instructorId },
      order: { maKH: 'DESC' },
    });
  }

  async createCourse(payload: any, mucTieu: string[], yeuCau: string[]) {
    const newCourse = this.khoaHocRepository.create(payload);
    const savedCourse = await this.khoaHocRepository.save(newCourse);
    const courseId = (savedCourse as any).maKH;

    if (mucTieu && mucTieu.length > 0) {
      for (const noiDung of mucTieu) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO MucTieuKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    if (yeuCau && yeuCau.length > 0) {
      for (const noiDung of yeuCau) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO YeuCauKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    return savedCourse;
  }

  async remove(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền xóa khóa học này');
    }

    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ChiTietHoaDon WHERE MaKH = ?`,
      [courseId],
    );

    if (hasBuyers[0].count > 0) {
      await this.khoaHocRepository.update(courseId, { trangThai: 'DRAFT' });
      return {
        message:
          'Khóa học đã có học viên mua, hệ thống đã chuyển sang trạng thái ẩn.',
      };
    }

    await this.khoaHocRepository.delete(courseId);
    return { message: 'Đã xóa khóa học thành công.' };
  }

  async updateCourseStatus(
    courseId: number,
    instructorId: number,
    trangThai: string,
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');
    }

    if (trangThai === 'PENDING') {
      const lessonCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM BaiHoc WHERE MaKH = ?`,
        [courseId],
      );

      if (Number(lessonCount[0].count) === 0) {
        throw new BadRequestException(
          'Khóa học chưa hoàn thiện. Cần ít nhất 1 bài học để gửi duyệt!',
        );
      }
    }

    await this.khoaHocRepository.update(courseId, { trangThai });
    return { message: 'Cập nhật trạng thái thành công' };
  }

  async getCourseById(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Không tìm thấy khóa học hoặc bạn không có quyền truy cập',
      );
    }

    const mucTieuData = await this.dataSource.query(
      `SELECT NoiDung FROM MucTieuKhoaHoc WHERE MaKH = ?`,
      [courseId],
    );
    const yeuCauData = await this.dataSource.query(
      `SELECT NoiDung FROM YeuCauKhoaHoc WHERE MaKH = ?`,
      [courseId],
    );

    return {
      ...course,
      muc_tieu: mucTieuData.map((item: any) => item.NoiDung),
      yeu_cau: yeuCauData.map((item: any) => item.NoiDung),
    };
  }

  async updateCourse(
    courseId: number,
    instructorId: number,
    payload: any,
    mucTieu: string[],
    yeuCau: string[],
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');
    }

    const previousThumbnail = course.hinhThuNho;
    const nextThumbnail = payload.hinhThuNho;

    Object.assign(course, payload);
    const updatedCourse = await this.khoaHocRepository.save(course);

    if (mucTieu !== undefined) {
      await this.dataSource.query(`DELETE FROM MucTieuKhoaHoc WHERE MaKH = ?`, [
        courseId,
      ]);
      for (const noiDung of mucTieu) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO MucTieuKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    if (yeuCau !== undefined) {
      await this.dataSource.query(`DELETE FROM YeuCauKhoaHoc WHERE MaKH = ?`, [
        courseId,
      ]);
      for (const noiDung of yeuCau) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO YeuCauKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()],
          );
        }
      }
    }

    if (
      previousThumbnail &&
      nextThumbnail &&
      previousThumbnail !== nextThumbnail
    ) {
      const oldPublicId =
        this.cloudinaryService.extractPublicId(previousThumbnail);
      if (oldPublicId) {
        await this.cloudinaryService.deleteFile(oldPublicId, 'image');
      }
    }

    return updatedCourse;
  }
}
