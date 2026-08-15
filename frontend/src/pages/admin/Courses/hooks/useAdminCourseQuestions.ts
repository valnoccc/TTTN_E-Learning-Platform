import { useEffect, useState } from 'react';
import axiosClient from '../../../../api/axios';

export type AdminQuizAnswerKey = 'A' | 'B' | 'C' | 'D';

export interface AdminQuizQuestion {
    maCauHoi: number;
    maChuong: number;
    noiDung: string;
    dapAnA: string;
    dapAnB: string;
    dapAnC: string;
    dapAnD: string;
    dapAnDung: AdminQuizAnswerKey;
    thuTu: number;
}

export interface AdminQuizQuestionChapter {
    maChuong: number;
    tenChuong: string;
    thuTuChuong: number;
    questions: AdminQuizQuestion[];
}

export function useAdminCourseQuestions(courseId: number) {
    const [chapters, setChapters] = useState<AdminQuizQuestionChapter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQuestions = async () => {
            if (!Number.isFinite(courseId) || courseId <= 0) {
                setChapters([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await axiosClient.get<
                    AdminQuizQuestionChapter[] | { data?: AdminQuizQuestionChapter[] }
                >(
                    `/admin/courses/${courseId}/quiz-questions`,
                );
                const chapters = Array.isArray(response) ? response : response?.data;
                setChapters(Array.isArray(chapters) ? chapters : []);
            } catch {
                setChapters([]);
            } finally {
                setLoading(false);
            }
        };

        void loadQuestions();
    }, [courseId]);

    return { chapters, loading };
}
