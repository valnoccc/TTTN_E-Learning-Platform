import { useEffect, useMemo, useState } from 'react';

import axiosClient from '../../../../api/axios';

export type InstructorCourseOption = {
    courseId: number;
    courseName: string;
    coursePrice: number;
    status: string;
    createdAt: string;
};

export type InstructorStudentCourse = {
    courseId: number;
    courseName: string;
    coursePrice: number;
    purchasedAt: string;
};

export type InstructorStudentSummary = {
    studentId: number;
    studentName: string;
    studentEmail: string;
    totalCourses: number;
    totalSpent: number;
    lastPurchasedAt: string;
    courses: InstructorStudentCourse[];
};

export type InstructorStudentBoard = {
    totalStudents: number;
    totalPurchases: number;
    totalRevenue: number;
    students: InstructorStudentSummary[];
};

export function useStudentBoard() {
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
            } finally {
                setLoading(false);
            }
        };

        void loadInitialData();
    }, []);

    const loadStudents = async (nextCourseId = courseId, nextSearch = appliedSearch) => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (nextCourseId) {
                params.courseId = nextCourseId;
            }
            if (nextSearch.trim()) {
                params.search = nextSearch.trim();
            }

            const studentBoard = await axiosClient.get<InstructorStudentBoard>('/instructors/me/students', {
                params,
            });
            setBoard(studentBoard);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        setAppliedSearch(searchInput);
        void loadStudents(courseId, searchInput);
    };

    const selectedCourseName = useMemo(() => {
        if (!courseId) {
            return 'Tất cả khóa học';
        }

        return (
            courses.find((course) => String(course.courseId) === courseId)?.courseName ||
            'Khóa học đã chọn'
        );
    }, [courseId, courses]);

    return {
        applyFilters,
        board,
        courseId,
        courses,
        loading,
        searchInput,
        selectedCourseName,
        setCourseId,
        setSearchInput,
    };
}
