import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export type InstructorCourseOption = {
    courseId: number;
    courseName: string;
    coursePrice: number;
    status: string;
    createdAt: string;
};

export type StudentEnrollmentSummary = {
    studentId: number;
    studentName: string;
    studentEmail: string;
    courseId: number;
    courseName: string;
    totalSpent: number;
    purchasedAt: string;
};

export type InstructorStudentBoard = {
    totalStudents: number;
    totalPurchases: number;
    totalRevenue: number;
    students: StudentEnrollmentSummary[];
};

const ITEMS_PER_PAGE = 10;

export function useStudentEvaluations() {
    const [courses, setCourses] = useState<InstructorCourseOption[]>([]);
    const [board, setBoard] = useState<InstructorStudentBoard>({
        totalStudents: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        students: [],
    });
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [courseId, setCourseId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

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
                toast.error('Không thể tải dữ liệu học viên');
            } finally {
                setLoading(false);
            }
        };

        void loadInitialData();
    }, []);

    const loadStudents = async (
        nextCourseId = courseId,
        nextSearch = appliedSearch,
    ) => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (nextCourseId) params.courseId = nextCourseId;
            if (nextSearch.trim()) params.search = nextSearch.trim();

            const studentBoard = await axiosClient.get<InstructorStudentBoard>(
                '/instructors/me/students',
                { params },
            );
            setBoard(studentBoard);
            setCurrentPage(1);
        } catch {
            toast.error('Lỗi khi lọc dữ liệu học viên');
        } finally {
            setLoading(false);
        }
    };

    const selectedCourseName = useMemo(() => {
        if (!courseId) return 'Tất cả khóa học';
        return (
            courses.find((course) => String(course.courseId) === courseId)?.courseName ??
            'Khóa học đã chọn'
        );
    }, [courseId, courses]);

    const totalPages = useMemo(
        () => Math.ceil(board.students.length / ITEMS_PER_PAGE),
        [board.students.length],
    );

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
        selectedCourseName,
        loadStudents,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedStudents,
        paginationMeta,
    };
}
