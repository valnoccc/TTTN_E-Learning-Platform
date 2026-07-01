import { Lesson } from '../entities/lesson.entity';

export function serializeLesson(lesson: Lesson) {
  return {
    id: lesson.maBH,
    maBH: lesson.maBH,
    maKH: lesson.maKH,
    tenBaiHoc: lesson.tenBaiHoc,
    videoURL: lesson.videoURL ?? null,
    thuTu: lesson.thuTu,
    thoiLuong: lesson.thoiLuong,
    choPhepXemTruoc: lesson.choPhepXemTruoc ?? false,
    tieu_de: lesson.tenBaiHoc,
    id_khoa_hoc: lesson.maKH,
    thu_tu: lesson.thuTu,
    video_url: lesson.videoURL ?? null,
    cho_phep_xem_truoc: lesson.choPhepXemTruoc ?? false,
    // AI Moderation fields
    aiStatus: lesson.aiStatus ?? null,
    aiLabels: lesson.aiLabels ?? [],
    aiRejectReason: lesson.aiRejectReason ?? null,
    durationSeconds: lesson.durationSeconds ?? 0,
  };
}
