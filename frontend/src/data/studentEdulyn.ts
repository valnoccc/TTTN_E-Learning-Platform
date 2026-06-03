export type StudentCourse = {
  id: string;
  title: string;
  category: string;
  price: string;
  duration: string;
  lessons: number;
  level: string;
  rating: number;
  image: string;
  description: string;
  instructor: string;
  banner: string;
  featured?: boolean;
  outcomes: string[];
  curriculum: Array<{ title: string; duration: string }>;
};

export type StudentFaq = {
  question: string;
  answer: string;
};

export type StudentTestimonial = {
  name: string;
  role: string;
  quote: string;
  avatar: string;
};

export const studentStats = [
  { label: 'Khóa học', value: '120+' },
  { label: 'Giảng viên', value: '35+' },
  { label: 'Học viên', value: '8k+' },
  { label: 'Tỷ lệ hoàn thành', value: '92%' },
];

export const studentCourses: StudentCourse[] = [
  {
    id: 'react-masterclass',
    title: 'React Masterclass',
    category: 'Development',
    price: '1.250.000đ',
    duration: '28 giờ',
    lessons: 42,
    level: 'Intermediate',
    rating: 4.9,
    image: '/assets/images/course-1.jpg',
    banner: '/assets/images/details-banner.jpg',
    description:
      'Lộ trình thực chiến cho học viên muốn xây dựng ứng dụng React hiện đại từ nền tảng đến production.',
    instructor: 'Nguyễn Văn A',
    featured: true,
    outcomes: [
      'Xây dựng component theo tư duy tái sử dụng',
      'Tổ chức state, routing và data flow rõ ràng',
      'Hoàn thành dự án cuối khóa có thể đưa vào portfolio',
    ],
    curriculum: [
      { title: 'Giới thiệu React 19 và Vite', duration: '45 phút' },
      { title: 'Component, props, state', duration: '90 phút' },
      { title: 'Routing và layout patterns', duration: '75 phút' },
      { title: 'Fetch data và quản lý dữ liệu', duration: '120 phút' },
      { title: 'Project thực hành', duration: '240 phút' },
    ],
  },
  {
    id: 'ui-design-basics',
    title: 'UI Design Basics',
    category: 'Design',
    price: '890.000đ',
    duration: '18 giờ',
    lessons: 24,
    level: 'Beginner',
    rating: 4.8,
    image: '/assets/images/course-2.jpg',
    banner: '/assets/images/course-2.jpg',
    description:
      'Khóa học tập trung vào bố cục, phân cấp thị giác và cách thiết kế giao diện học tập dễ dùng.',
    instructor: 'Trần Thị B',
    featured: true,
    outcomes: [
      'Hiểu nguyên tắc bố cục và khoảng trắng',
      'Thiết kế dashboard và landing page rõ ràng',
      'Tạo giao diện có nhịp điệu và tính nhất quán',
    ],
    curriculum: [
      { title: 'Nguyên lý thị giác', duration: '60 phút' },
      { title: 'Typography và màu sắc', duration: '75 phút' },
      { title: 'Wireframe và layout', duration: '90 phút' },
      { title: 'Mini project', duration: '180 phút' },
    ],
  },
  {
    id: 'backend-for-frontend',
    title: 'Backend for Frontend',
    category: 'Development',
    price: '1.490.000đ',
    duration: '32 giờ',
    lessons: 38,
    level: 'Advanced',
    rating: 4.7,
    image: '/assets/images/course-3.jpg',
    banner: '/assets/images/course-3.jpg',
    description:
      'Tư duy API dành cho frontend: dữ liệu, xác thực, caching và tích hợp hệ thống học tập.',
    instructor: 'Lê Văn C',
    featured: true,
    outcomes: [
      'Thiết kế contract dữ liệu rõ ràng cho frontend',
      'Làm việc với auth token và phân quyền',
      'Nắm luồng sync dữ liệu giữa UI và API',
    ],
    curriculum: [
      { title: 'REST API essentials', duration: '90 phút' },
      { title: 'Authentication flow', duration: '110 phút' },
      { title: 'State sync strategies', duration: '80 phút' },
      { title: 'Capstone integration', duration: '260 phút' },
    ],
  },
  {
    id: 'product-thinking',
    title: 'Product Thinking for Students',
    category: 'Business',
    price: '650.000đ',
    duration: '14 giờ',
    lessons: 18,
    level: 'Beginner',
    rating: 4.8,
    image: '/assets/images/course-4.jpg',
    banner: '/assets/images/course-4.jpg',
    description:
      'Dành cho học viên muốn hiểu cách học theo mục tiêu, roadmap và làm dự án có định hướng.',
    instructor: 'Phạm Thị D',
    outcomes: [
      'Xác định mục tiêu học rõ ràng',
      'Lập roadmap cá nhân theo từng giai đoạn',
      'Biết đánh giá tiến độ và kết quả học',
    ],
    curriculum: [
      { title: 'Tư duy sản phẩm', duration: '50 phút' },
      { title: 'Kế hoạch học tập', duration: '80 phút' },
      { title: 'Portfolio và CV', duration: '70 phút' },
    ],
  },
];

export const studentTestimonials: StudentTestimonial[] = [
  {
    name: 'Minh Anh',
    role: 'Học viên React',
    quote: 'Giao diện rõ ràng, phần course detail đủ sâu để học nhanh mà vẫn không bị rối.',
    avatar: '/assets/images/testimonial-1.jpg',
  },
  {
    name: 'Quang Huy',
    role: 'Học viên UI/UX',
    quote: 'Layout template đẹp hơn trang cũ rất nhiều, nhất là phần hero và các card khóa học.',
    avatar: '/assets/images/testimonial-2.jpg',
  },
  {
    name: 'Thu Hà',
    role: 'Học viên Backend',
    quote: 'Tôi có thể dùng ngay những trang này cho khu học viên mà không cần tự thiết kế từ đầu.',
    avatar: '/assets/images/testimonial-3.jpg',
  },
];

export const studentFaqs: StudentFaq[] = [
  {
    question: 'Học viên có thể xem khóa học theo danh mục không?',
    answer: 'Có. Trang courses hỗ trợ lọc theo danh mục, cấp độ và tìm nhanh theo từ khóa.',
  },
  {
    question: 'Trang chi tiết khóa học có hiển thị lộ trình học không?',
    answer: 'Có. Mỗi khóa học có phần curriculum, outcomes và thông tin giảng viên.',
  },
  {
    question: 'Có thể dùng các trang này cho student FE hiện tại không?',
    answer: 'Có. Chúng được port vào FE hiện tại theo route `/student/*` và không cần giữ dashboard cũ.',
  },
  {
    question: 'Dữ liệu hiển thị là thật hay mock?',
    answer: 'Hiện tại là mock UI theo template. Khi cần có thể nối dần sang API thật của backend.',
  },
];
