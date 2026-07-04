export class DashboardStatsDto {
  totalStudents!: number;
  studentGrowth!: number;
  totalInstructors!: number;
  instructorGrowth!: number;
  totalCourses!: number;
  courseGrowth!: number;
  pendingCourses!: number;
  pendingCourseGrowth!: number;
  newEnrollments!: number;
  newEnrollmentGrowth!: number;
  totalRevenue!: number;
  grossRevenue!: number;
  adminRevenue!: number;
  instructorPayout!: number;
  revenueGrowth!: number;
  recentOrders!: {
    orderId: number;
    customerName: string;
    courseName: string;
    totalAmount: number;
    paidAt: string;
    paymentMethod: string;
    paymentStatus: string;
  }[];
  revenueChart!: {
    thang: number;
    nam: number;
    doanhThu: number;
  }[];
  salesOverview!: {
    orders: number;
    earnings: number;
    grossRevenue: number;
    adminRevenue: number;
    instructorPayout: number;
    refunds: number;
  };
  salesChart!: {
    label: string;
    orders: number;
    earnings: number;
    grossRevenue: number;
    adminRevenue: number;
    instructorPayout: number;
    refunds: number;
  }[];
  topCourses!: {
    id: number;
    name: string;
    date: string;
    price: number;
    orders: number;
    revenue: number;
    adminRevenue: number;
    instructorRevenue: number;
    image: string;
  }[];
  topInstructors!: {
    id: number;
    name: string;
    category: string;
    students: number;
    revenue: number;
    grossRevenue: number;
    adminRevenue: number;
    percentage: number;
    avatar: string;
  }[];
  categoryRevenue!: {
    id: number;
    name: string;
    revenue: number;
    adminRevenue: number;
    instructorPayout: number;
  }[];
}

export class AdminInstructorDebtItemDto {
  instructorId!: number;
  instructorName!: string;
  instructorAvatar!: string | null;
  specialty!: string | null;
  courseCount!: number;
  orderCount!: number;
  grossRevenue!: number;
  adminRevenue!: number;
  instructorPayout!: number;
  debtAmount!: number;
}

export class AdminInstructorDebtSummaryDto {
  totalInstructors!: number;
  totalCourses!: number;
  totalOrders!: number;
  grossRevenue!: number;
  adminRevenue!: number;
  instructorPayout!: number;
  topDebtAmount!: number;
}

export class AdminInstructorDebtBoardDto {
  month!: number;
  year!: number;
  monthLabel!: string;
  summary!: AdminInstructorDebtSummaryDto;
  items!: AdminInstructorDebtItemDto[];
}
