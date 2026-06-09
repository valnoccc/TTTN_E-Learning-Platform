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
}