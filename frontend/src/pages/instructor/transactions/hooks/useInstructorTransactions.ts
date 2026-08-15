import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export type InstructorTransactionCourse = {
  courseId: number;
  courseName: string;
  coursePrice: number;
  status: string;
  createdAt: string;
};

export type InstructorTransaction = {
  invoiceId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseName: string;
  transactionAmount: number;
  instructorAmount: number;
  paymentMethod: string | null;
  purchasedAt: string;
  paymentStatus: string;
};

export type InstructorTransactionBoard = {
  totalTransactions: number;
  totalGrossRevenue: number;
  totalInstructorRevenue: number;
  transactions: InstructorTransaction[];
};

const ITEMS_PER_PAGE = 10;

export function useInstructorTransactions() {
  const [courses, setCourses] = useState<InstructorTransactionCourse[]>([]);
  const [board, setBoard] = useState<InstructorTransactionBoard>({
    totalTransactions: 0,
    totalGrossRevenue: 0,
    totalInstructorRevenue: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadTransactions = async (
    nextCourseId = courseId,
    nextSearch = appliedSearch,
  ) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nextCourseId) params.courseId = nextCourseId;
      if (nextSearch.trim()) params.search = nextSearch.trim();

      const response = await axiosClient.get<InstructorTransactionBoard>(
        '/instructors/me/transactions',
        { params },
      );
      setBoard(response);
      setCurrentPage(1);
    } catch {
      toast.error('Không thể tải giao dịch của giảng viên.');
      setBoard({
        totalTransactions: 0,
        totalGrossRevenue: 0,
        totalInstructorRevenue: 0,
        transactions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [courseList, transactionBoard] = await Promise.all([
          axiosClient.get<InstructorTransactionCourse[]>('/instructors/me/courses'),
          axiosClient.get<InstructorTransactionBoard>('/instructors/me/transactions'),
        ]);
        setCourses(courseList);
        setBoard(transactionBoard);
      } catch {
        toast.error('Không thể tải dữ liệu giao dịch.');
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const selectedCourseName = useMemo(() => {
    if (!courseId) return 'Tất cả khóa học';
    return courses.find((course) => String(course.courseId) === courseId)?.courseName ?? 'Khóa học đã chọn';
  }, [courseId, courses]);

  const totalPages = Math.ceil(board.transactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return board.transactions.slice(start, start + ITEMS_PER_PAGE);
  }, [board.transactions, currentPage]);

  const paginationMeta = useMemo(() => {
    const indexOfFirst = (currentPage - 1) * ITEMS_PER_PAGE;
    return {
      indexOfFirst,
      indexOfLast: indexOfFirst + ITEMS_PER_PAGE,
      totalItems: board.transactions.length,
    };
  }, [board.transactions.length, currentPage]);

  return {
    courses,
    board,
    loading,
    searchInput,
    setSearchInput,
    setAppliedSearch,
    courseId,
    setCourseId,
    selectedCourseName,
    loadTransactions,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedTransactions,
    paginationMeta,
  };
}
