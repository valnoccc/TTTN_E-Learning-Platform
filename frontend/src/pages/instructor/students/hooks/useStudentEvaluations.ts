import { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../../../api/axios';
import { toast } from 'react-hot-toast';

export type InstructorCourseOption = {
    courseId: number;
    courseName: string;
    coursePrice: number;
    status: string;
    createdAt: string;
};

export type SubmissionStatus = 'NOT_SUBMITTED' | 'PENDING' | 'PASSED' | 'FAILED';

export type StudentSubmissionSummary = {
    studentId: number;
    studentName: string;
    studentEmail: string;
    courseId: number;
    courseName: string;
    totalSpent: number;
    purchasedAt: string;
    githubLink?: string;
    status: SubmissionStatus;
    score?: number;
    feedback?: string;
    evaluatedAt?: string;
};

export type InstructorStudentBoard = {
    totalStudents: number;
    totalPurchases: number;
    totalRevenue: number;
    students: StudentSubmissionSummary[];
};

export function useStudentEvaluations() {
    const [courses, setCourses] = useState<InstructorCourseOption[]>([]);
    const [board, setBoard] = useState<InstructorStudentBoard>({
        totalStudents: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        students: [],
    });
    const [loading, setLoading] = useState(true);

    // Search & Filter state
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [courseId, setCourseId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // THÊM: Quản lý phân trang cục bộ
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

    // Modal chấm bài state
    const [selectedStudent, setSelectedStudent] = useState<StudentSubmissionSummary | null>(null);
    const [scoreInput, setScoreInput] = useState<string>('');
    const [feedbackInput, setFeedbackInput] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [courseList, studentBoard] = await Promise.all([
                    axiosClient.get<InstructorCourseOption[]>('/instructors/me/courses'),
                    axiosClient.get<InstructorStudentBoard>('/instructors/me/students'),
                ]);
                setCourses(courseList);
                setBoard(studentBoard);
            } catch {
                toast.error('Không thể tải dữ liệu ban đầu!');
            } finally {
                setLoading(false);
            }
        };
        void loadInitialData();
    }, []);

    const loadStudents = async (nextCourseId = courseId, nextSearch = appliedSearch, nextStatus = statusFilter) => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (nextCourseId) params.courseId = nextCourseId;
            if (nextSearch.trim()) params.search = nextSearch.trim();
            if (nextStatus) params.status = nextStatus;

            const studentBoard = await axiosClient.get<InstructorStudentBoard>('/instructors/me/students', { params });
            setBoard(studentBoard);
            setCurrentPage(1); // Quay về trang 1 khi lọc
        } catch {
            toast.error('Lỗi khi lọc dữ liệu học viên!');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGradeModal = (student: StudentSubmissionSummary) => {
        setSelectedStudent(student);
        setScoreInput(student.score !== undefined ? String(student.score) : '');
        setFeedbackInput(student.feedback || '');
    };

    const handleCloseGradeModal = () => {
        setSelectedStudent(null);
    };

    const handleSaveEvaluation = async (status: 'PASSED' | 'FAILED') => {
        if (!selectedStudent) return;
        if (scoreInput === '') return toast.error('Vui lòng nhập điểm số!');

        const numScore = Number(scoreInput);
        if (isNaN(numScore) || numScore < 0 || numScore > 10) {
            return toast.error('Điểm số phải nằm trong khoảng từ 0 đến 10!');
        }

        setIsSaving(true);
        try {
            await axiosClient.post(`/instructors/evaluations`, {
                studentId: selectedStudent.studentId,
                courseId: selectedStudent.courseId,
                score: numScore,
                feedback: feedbackInput,
                status: status
            });

            toast.success('Đã lưu kết quả đánh giá thành công!');

            setBoard(prev => ({
                ...prev,
                students: prev.students.map(s =>
                    s.studentId === selectedStudent.studentId && s.courseId === selectedStudent.courseId
                        ? { ...s, score: numScore, feedback: feedbackInput, status: status }
                        : s
                )
            }));
            handleCloseGradeModal();
        } catch {
            toast.error('Không thể lưu kết quả chấm bài!');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedCourseName = useMemo(() => {
        if (!courseId) return 'Tất cả khóa học';
        return courses.find((course) => String(course.courseId) === courseId)?.courseName ?? 'Khóa học đã chọn';
    }, [courseId, courses]);

    // THÊM: Logic tính toán phân trang dữ liệu
    const totalPages = useMemo(() => {
        return Math.ceil(board.students.length / ITEMS_PER_PAGE);
    }, [board.students.length]);

    const paginatedStudents = useMemo(() => {
        const indexOfLast = currentPage * ITEMS_PER_PAGE;
        const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
        return board.students.slice(indexOfFirst, indexOfLast);
    }, [board.students, currentPage]);

    const paginationMeta = useMemo(() => {
        const indexOfLast = currentPage * ITEMS_PER_PAGE;
        const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
        return {
            indexOfFirst,
            indexOfLast,
            totalItems: board.students.length,
        };
    }, [board.students.length, currentPage]);

    return {
        courses,
        board,
        loading,
        searchInput,
        setSearchInput,
        appliedSearch,
        setAppliedSearch,
        courseId,
        setCourseId,
        statusFilter,
        setStatusFilter,
        selectedCourseName,
        loadStudents,

        // THÊM: Biến cho phân trang
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedStudents,
        paginationMeta,

        // Modal & Grade Actions
        selectedStudent,
        scoreInput,
        setScoreInput,
        feedbackInput,
        setFeedbackInput,
        isSaving,
        handleOpenGradeModal,
        handleCloseGradeModal,
        handleSaveEvaluation
    };
}