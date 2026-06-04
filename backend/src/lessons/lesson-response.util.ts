import { Lesson } from './entities/lesson.entity';

function serializeSingleLesson(lesson: Lesson | null | undefined) {
  if (!lesson) {
    return lesson;
  }

  return {
    maBH: lesson.maBH,
    maKH: lesson.maKH,
    tenBaiHoc: lesson.tenBaiHoc,
    videoURL: lesson.videoURL ?? null,
    thuTu: lesson.thuTu,
    id: lesson.maBH,
    id_khoa_hoc: lesson.maKH,
    tieu_de: lesson.tenBaiHoc,
    video_url: lesson.videoURL ?? null,
    thu_tu: lesson.thuTu,
  };
}

export function serializeLesson(lesson: Lesson[] | Lesson | null | undefined) {
  if (Array.isArray(lesson)) {
    return lesson.map(serializeSingleLesson);
  }

  return serializeSingleLesson(lesson);
}
