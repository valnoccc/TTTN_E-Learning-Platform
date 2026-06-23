export class DashboardStatsDto {
  totalStudents!: number;
  studentGrowth!: number;
  totalInstructors!: number;
  instructorGrowth!: number;
  totalCourses!: number;
  courseGrowth!: number;
  totalRevenue!: number;
  grossRevenue!: number;
  adminRevenue!: number;
  instructorPayout!: number;
  revenueGrowth!: number;
  recentOrders!: any[];
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
}
