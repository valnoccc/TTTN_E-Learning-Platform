import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    BookOpen, Search, ArrowRight, PlayCircle, Star,
    Users, MonitorPlay, Award, Quote, CheckCircle2
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import CourseCard from '../components/ui/CourseCard';

export default function HomePage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        if (user?.role === 'ADMIN') navigate('/admin');
        if (user?.role === 'GIANG_VIEN') navigate('/instructor');
    }, [user, navigate]);

    return (
        <MainLayout>
            {/* 1. Hero Section - Tối giản, tập trung vào thông điệp */}
            <section className="pt-24 pb-20 px-6 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold tracking-wide uppercase mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Nền tảng học tập thế hệ mới
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-[#1D1D1F]">
                    Học tập không giới hạn. <br className="hidden md:block" /> Sáng tạo tương lai.
                </h1>
                <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-medium tracking-tight leading-relaxed">
                    Trải nghiệm không gian học trực tuyến tinh gọn, mượt mà và hoàn toàn không xao nhãng. Khám phá hơn 500+ khóa học từ các chuyên gia hàng đầu.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {!user ? (
                        <Link to="/register" className="flex items-center gap-2 bg-[#1D1D1F] text-white px-8 py-3.5 rounded-full text-[15px] font-medium hover:bg-black hover:scale-105 transition-all shadow-lg">
                            Bắt đầu miễn phí <ArrowRight size={18} />
                        </Link>
                    ) : (
                        <Link to="/student" className="flex items-center gap-2 bg-[#0071E3] text-white px-8 py-3.5 rounded-full text-[15px] font-medium hover:bg-[#0077ED] hover:scale-105 transition-all shadow-lg shadow-blue-500/30">
                            Vào góc học tập <PlayCircle size={18} />
                        </Link>
                    )}
                    <a href="#courses" className="flex items-center gap-2 bg-white text-[#1D1D1F] border border-gray-200 px-8 py-3.5 rounded-full text-[15px] font-medium hover:bg-gray-50 transition-all">
                        Khám phá lộ trình
                    </a>
                </div>
            </section>

            {/* 2. Banner Thống kê (Social Proof) */}
            <section className="border-y border-gray-200 bg-white py-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100 text-center">
                        <StatBlock number="50,000+" label="Học viên toàn cầu" />
                        <StatBlock number="250+" label="Khóa học chất lượng" />
                        <StatBlock number="4.9/5" label="Điểm đánh giá" />
                        <StatBlock number="100%" label="Hỗ trợ trọn đời" />
                    </div>
                </div>
            </section>

            {/* 3. Lợi ích cốt lõi (Features) */}
            <section className="py-24 bg-[#F5F5F7]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1D1D1F] mb-4">Thiết kế cho sự tập trung.</h2>
                        <p className="text-gray-500 font-medium max-w-2xl mx-auto">Mọi tính năng đều được tối ưu hóa để mang lại trải nghiệm học tập trọn vẹn nhất, loại bỏ mọi rào cản kỹ thuật.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<MonitorPlay size={24} className="text-blue-500" />}
                            title="Giao diện tối giản"
                            desc="Hệ thống UI/UX chuẩn macOS, thân thiện, dễ sử dụng, giúp bạn hoàn toàn chìm đắm vào bài học."
                        />
                        <FeatureCard
                            icon={<Users size={24} className="text-orange-500" />}
                            title="Cộng đồng năng động"
                            desc="Hệ thống thảo luận trực tiếp dưới mỗi bài giảng. Kết nối với giảng viên và hàng ngàn học viên khác."
                        />
                        <FeatureCard
                            icon={<Award size={24} className="text-green-500" />}
                            title="Chứng chỉ uy tín"
                            desc="Nhận chứng chỉ điện tử có giá trị sau khi hoàn thành khóa học, dễ dàng đính kèm vào hồ sơ xin việc."
                        />
                    </div>
                </div>
            </section>

            {/* 4. Danh sách Khóa học (Đã cập nhật dữ liệu giả xịn hơn) */}
            <section id="courses" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">Khóa học xu hướng.</h2>
                            <p className="text-gray-500 mt-2 font-medium">Cập nhật những kỹ năng được săn đón nhất năm 2026.</p>
                        </div>
                        <Link to="#" className="hidden md:flex items-center gap-1 text-[#0071E3] font-medium hover:underline">
                            Xem tất cả danh mục <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <CourseCard
                            tag="Frontend" title="Xây dựng UI với React & Tailwind" instructor="Chu Văn Lộc" price="599.000đ" rating="4.9"
                        />
                        <CourseCard
                            tag="Backend" title="Kiến trúc Microservices Node.js" instructor="Nguyễn Văn A" price="850.000đ" rating="4.8"
                        />
                        <CourseCard
                            tag="Design" title="Figma Masterclass 2026" instructor="Trần Thị B" price="Miễn phí" rating="5.0"
                        />
                        <CourseCard
                            tag="Database" title="Tối ưu hóa truy vấn MySQL" instructor="Hệ Thống" price="400.000đ" rating="4.7"
                        />
                    </div>
                </div>
            </section>

            {/* 5. Cảm nhận học viên (Testimonials) */}
            <section className="py-24 bg-[#F5F5F7] border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold tracking-tight text-center text-[#1D1D1F] mb-16">Học viên nói gì về chúng tôi.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TestimonialCard
                            name="Phạm Hoàng M." role="Sinh viên STU"
                            text="Chưa bao giờ mình thấy một hệ thống học tập của trường lại có giao diện đẹp và mượt mà đến vậy. Rất giống phong cách của Apple!"
                        />
                        <TestimonialCard
                            name="Lê Hải Y." role="Lập trình viên Fresher"
                            text="Nhờ các khóa học chuyên sâu trên STU Learning, mình đã nắm vững React và tự tin pass phỏng vấn vòng chuyên môn."
                        />
                        <TestimonialCard
                            name="Vũ Đức T." role="Học viên tự do"
                            text="Tốc độ tải video cực nhanh, không có quảng cáo, bài tập thực hành được chấm điểm ngay lập tức. Đánh giá 5 sao!"
                        />
                    </div>
                </div>
            </section>

            {/* 6. Call to Action (CTA) Cuối trang */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center bg-[#FBFBFD] border border-gray-200 rounded-3xl p-12 shadow-sm">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1D1D1F] mb-4">Sẵn sàng để bứt phá?</h2>
                    <p className="text-gray-500 mb-8 font-medium">Tham gia cùng hàng ngàn học viên khác và bắt đầu nâng cấp kỹ năng của bạn ngay hôm nay.</p>
                    <ul className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-medium text-gray-600">
                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Không yêu cầu thẻ tín dụng</li>
                        <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Hoàn tiền trong 7 ngày</li>
                    </ul>
                    <Link to="/register" className="inline-block bg-[#0071E3] text-white px-10 py-4 rounded-full text-[15px] font-semibold hover:bg-[#0077ED] transition-colors shadow-lg">
                        Tạo tài khoản miễn phí
                    </Link>
                </div>
            </section>

        </MainLayout>
    );
}

// --- CÁC COMPONENT PHỤ TRỢ (Để code gọn gàng) ---

interface StatBlockProps {
    number: string | number;
    label: string;
}

function StatBlock({ number, label }: StatBlockProps) {
    return (
        <div className="px-4">
            <div className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-1">{number}</div>
            <div className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">{label}</div>
        </div>
    );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6 border border-gray-100">
                {icon}
            </div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-[#1D1D1F]">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

interface TestimonialCardProps {
    name: string;
    role: string;
    text: string;
}

function TestimonialCard({ name, role, text }: TestimonialCardProps) {
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 relative">
            <Quote size={40} className="text-gray-100 absolute top-6 right-6" />
            <div className="flex items-center gap-2 text-amber-400 mb-4">
                <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
            </div>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-6 italic">"{text}"</p>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700">
                    {name.charAt(0)}
                </div>
                <div>
                    <div className="font-semibold text-sm text-[#1D1D1F]">{name}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{role}</div>
                </div>
            </div>
        </div>
    );
}