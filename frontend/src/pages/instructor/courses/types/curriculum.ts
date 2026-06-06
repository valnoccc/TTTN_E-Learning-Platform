export interface LessonData {
    maBH: number;
    maChuong: number;
    tenBaiHoc: string;
    videoUrl: string | null;
    noiDung: string | null;
    thuTu: number;
    thoiLuong: number;
}

export interface ChapterData {
    maChuong: number;
    maKH: number;
    tenChuong: string;
    thuTu: number;
    baiHocs: LessonData[]; // Mảng bài học lồng bên trong chương
}