import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export type InstructorReportRange =
  | '30days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'all_time';

export interface InstructorCourseOption {
  courseId: number;
  courseName: string;
  coursePrice: number;
  status: string;
  createdAt: string;
}

export interface InstructorRevenuePoint {
  label: string;
  revenue: number;
  grossRevenue: number;
  adminRevenue: number;
  instructorRevenue: number;
  enrollments: number;
}

export interface InstructorTopCourseReport {
  courseId: number;
  courseName: string;
  revenue: number;
  grossRevenue: number;
  adminRevenue: number;
  instructorRevenue: number;
  enrollments: number;
  ratingLabel: string;
  imageUrl: string | null;
}

export interface InstructorRecentEnrollment {
  enrollmentCode: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  courseId: number;
  courseName: string;
  amount: number;
  grossAmount: number;
  adminAmount: number;
  instructorAmount: number;
  couponCode: string | null;
  status: string;
  purchasedAt: string;
}

export interface InstructorReportsBoard {
  filters: {
    courseId: number | null;
    range: InstructorReportRange;
  };
  overview: {
    totalRevenue: number;
    grossRevenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    revenueGrowth: number;
    newEnrollments: number;
    enrollmentGrowth: number;
    averageRating: number | null;
    averageRatingLabel: string;
    averageRatingSource: 'mockdata' | 'database';
    completionRate: number | null;
    completionRateLabel: string;
    completionRateSource: 'mockdata';
  };
  revenueSeries: InstructorRevenuePoint[];
  revenueSeriesSource: 'database';
  topCourses: InstructorTopCourseReport[];
  topCoursesSource: 'database';
  recentEnrollments: InstructorRecentEnrollment[];
  recentEnrollmentsSource: 'database';
  revenueBySource: Array<{
    label: string;
    percentage: number;
    color: string;
    orderCount: number;
    grossRevenue: number;
  }>;
  revenueBySourceLabel: string;
  revenueBySourceSource: 'database' | 'mockdata';
}

const DEFAULT_BOARD: InstructorReportsBoard = {
  filters: {
    courseId: null,
    range: '30days',
  },
  overview: {
    totalRevenue: 0,
    grossRevenue: 0,
    adminRevenue: 0,
    instructorRevenue: 0,
    revenueGrowth: 0,
    newEnrollments: 0,
    enrollmentGrowth: 0,
    averageRating: null,
    averageRatingLabel: 'MOCKDATA',
    averageRatingSource: 'mockdata',
    completionRate: null,
    completionRateLabel: 'MOCKDATA',
    completionRateSource: 'mockdata',
  },
  revenueSeries: [],
  revenueSeriesSource: 'database',
  topCourses: [],
  topCoursesSource: 'database',
  recentEnrollments: [],
  recentEnrollmentsSource: 'database',
  revenueBySource: [],
  revenueBySourceLabel: 'MOCKDATA',
  revenueBySourceSource: 'mockdata',
};

function unwrapCourses(response: unknown): InstructorCourseOption[] {
  const data =
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data?: unknown }).data)
      ? (response as { data: InstructorCourseOption[] }).data
      : Array.isArray(response)
        ? (response as InstructorCourseOption[])
        : [];

  return data.map((course) => ({
    courseId: Number(course.courseId),
    courseName: course.courseName,
    coursePrice: Number(course.coursePrice),
    status: course.status,
    createdAt: course.createdAt,
  }));
}

export function useInstructorReports() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<InstructorCourseOption[]>([]);
  const [board, setBoard] = useState<InstructorReportsBoard>(DEFAULT_BOARD);
  const [courseId, setCourseId] = useState('');
  const [range, setRange] = useState<InstructorReportRange>('30days');

  const loadCourses = async () => {
    const response = await axiosClient.get<InstructorCourseOption[]>(
      '/instructors/me/courses',
    );
    setCourses(unwrapCourses(response));
  };

  const loadReports = async (
    nextCourseId = courseId,
    nextRange: InstructorReportRange = range,
  ) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        range: nextRange,
      };

      if (nextCourseId) {
        params.courseId = nextCourseId;
      }

      const response = await axiosClient.get<InstructorReportsBoard>(
        '/instructors/me/reports',
        { params },
      );
      setBoard(response);
    } catch {
      toast.error('Không thể tải dữ liệu báo cáo giảng viên');
      setBoard(DEFAULT_BOARD);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadCourses(), loadReports('', '30days')]);
      } catch {
        toast.error('Không thể khởi tạo trang báo cáo');
        setBoard(DEFAULT_BOARD);
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const selectedCourseName = useMemo(() => {
    if (!courseId) {
      return 'Tất cả khóa học';
    }

    return (
      courses.find((course) => String(course.courseId) === courseId)?.courseName ??
      'Khóa học đã chọn'
    );
  }, [courseId, courses]);

  return {
    loading,
    courses,
    board,
    courseId,
    setCourseId,
    range,
    setRange,
    loadReports,
    selectedCourseName,
  };
}
