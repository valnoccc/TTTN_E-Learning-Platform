export class DashboardStatsDto {
  totalStudents!: number;
  studentGrowth!: number;
  totalInstructors!: number;
  instructorGrowth!: number;
  totalCourses!: number;
  courseGrowth!: number;
  totalRevenue!: number;
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
    refunds: number;
  };
  salesChart!: {
    label: string;
    orders: number;
    earnings: number;
    refunds: number;
  }[];
  topCourses!: {
    id: number;
    name: string;
    date: string;
    price: number;
    orders: number;
    revenue: number;
    image: string;
  }[];
  topInstructors!: {
    id: number;
    name: string;
    category: string;
    students: number;
    revenue: number;
    percentage: number;
    avatar: string;
  }[];
}
