import { KhoaHoc } from '../entities/course.entity';

function serializeSingleCourse(course: KhoaHoc | null | undefined) {
  if (!course) {
    return course;
  }

  return {
    maKH: course.maKH,
    maDM: course.maDM,
    maND_GiangVien: course.maND_GiangVien,
    tenKhoaHoc: course.tenKhoaHoc,
    hinhThuNho: course.hinhThuNho,
    moTa: course.moTa ?? '',
    giaBan: course.giaBan,
    trangThai: course.trangThai,
    id: course.maKH,
    id_danh_muc: course.maDM,
    id_giang_vien: course.maND_GiangVien,
    ten_khoa_hoc: course.tenKhoaHoc,
    mo_ta: course.moTa ?? '',
    gia: course.giaBan,
    trang_thai: course.trangThai,
    hinh_thu_nho: course.hinhThuNho ?? null,
    hinh_anh: course.hinhThuNho ?? null,
  };
}

export function serializeCourse(
  course: KhoaHoc[] | KhoaHoc | null | undefined,
) {
  if (Array.isArray(course)) {
    return course.map(serializeSingleCourse);
  }

  return serializeSingleCourse(course);
}
