export type AiModerationStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'APPROVED'
    | 'REJECTED'
    | 'NEEDS_REVIEW'
    | null;

export type VideoSourceType = 'UPLOAD' | 'YOUTUBE';

export interface LessonData {
    maBH: number;
    maChuong: number;
    tenBaiHoc: string;
    videoUrl: string | null;
    noiDung: string | null;
    thuTu: number;
    thoiLuong: number;
    /** Trạng thái kiểm duyệt AI */
    aiStatus?: AiModerationStatus;
    /** Lý do từ chối (nếu aiStatus === REJECTED) */
    aiRejectReason?: string | null;
    /** Nguồn video */
    videoSourceType?: VideoSourceType;
}

export interface ChapterData {
    maChuong: number;
    maKH: number;
    tenChuong: string;
    thuTu: number;
    baiHocs: LessonData[]; // Mảng bài học lồng bên trong chương
}