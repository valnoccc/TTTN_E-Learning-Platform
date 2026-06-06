import { useState, useMemo, useEffect } from 'react';
import { useInstructorCourseContext } from '../CourseDetailShell';

export function useCourseLessons() {
    const { id, isLocked, lessons, handleDeleteLesson, navigate } = useInstructorCourseContext();
    const [currentPage, setCurrentPage] = useState(1);
    const lessonsPerPage = 5;

    const totalPages = Math.max(1, Math.ceil(lessons.length / lessonsPerPage));

    const paginatedLessons = useMemo(() => {
        const start = (currentPage - 1) * lessonsPerPage;
        return lessons.slice(start, start + lessonsPerPage);
    }, [currentPage, lessons]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return {
        id,
        isLocked,
        lessons,
        currentPage,
        totalPages,
        paginatedLessons,
        lessonsPerPage,
        setCurrentPage,
        handleDeleteLesson,
        navigate,
    };
}