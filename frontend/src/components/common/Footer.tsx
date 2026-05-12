import { BookOpen, Mail, MapPin, Phone, Globe, PlaySquare, Hash, MessageCircle } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#F5F5F7] border-t border-gray-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">

                {/* Top Footer: Grid 4 Cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Cột 1: Thông tin thương hiệu */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                            <BookOpen className="text-[#0071E3]" size={20} />
                            <span>E-Learning Platform</span>
                        </div>
                        <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                            Nền tảng học tập trực tuyến hàng đầu dành cho sinh viên công nghệ. Chúng tôi tập trung vào việc mang lại kiến thức thực chiến và trải nghiệm mượt mà nhất.
                        </p>
                        {/* Đã thay đổi các icon brand thành các icon generic */}
                        {/* Cột 1: Thông tin thương hiệu */}
                        <div className="flex gap-4 text-gray-400">
                            <span title="Website">
                                <Globe size={18} className="hover:text-[#0071E3] cursor-pointer transition-colors" />
                            </span>
                            <span title="Video Channel">
                                <PlaySquare size={18} className="hover:text-red-500 cursor-pointer transition-colors" />
                            </span>
                            <span title="Social Tag">
                                <Hash size={18} className="hover:text-black cursor-pointer transition-colors" />
                            </span>
                            <span title="Community">
                                <MessageCircle size={18} className="hover:text-blue-400 cursor-pointer transition-colors" />
                            </span>
                        </div>
                    </div>

                    {/* Cột 2: Khám phá */}
                    <div>
                        <h4 className="font-bold text-[14px] text-[#1D1D1F] mb-6">Khám phá</h4>
                        <ul className="space-y-4 text-[13px] text-gray-500 font-medium">
                            <li><a href="#" className="hover:text-[#0071E3] transition-colors">Tất cả khóa học</a></li>
                            <li><a href="#" className="hover:text-[#0071E3] transition-colors">Lộ trình học tập</a></li>
                            <li><a href="#" className="hover:text-[#0071E3] transition-colors">Giảng viên tiêu biểu</a></li>
                            <li><a href="#" className="hover:text-[#0071E3] transition-colors">Câu hỏi thường gặp</a></li>
                        </ul>
                    </div>

                    {/* Cột 3: Hỗ trợ & Liên hệ */}
                    <div>
                        <h4 className="font-bold text-[14px] text-[#1D1D1F] mb-6">Liên hệ hỗ trợ</h4>
                        <ul className="space-y-4 text-[13px] text-gray-500 font-medium">
                            <li className="flex items-start gap-3">
                                <MapPin size={16} className="shrink-0 text-gray-400" />
                                <span>180 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={16} className="shrink-0 text-gray-400" />
                                <span>(028) 3850 5520</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={16} className="shrink-0 text-gray-400" />
                                <span>support@stu.edu.vn</span>
                            </li>
                        </ul>
                    </div>

                    {/* Cột 4: Newsletter */}
                    <div>
                        <h4 className="font-bold text-[14px] text-[#1D1D1F] mb-6">Đăng ký nhận tin</h4>
                        <p className="text-[12px] text-gray-500 mb-4 font-medium">Nhận thông báo về các khóa học mới và ưu đãi sớm nhất.</p>
                        <form className="flex flex-col gap-2">
                            <input
                                type="email"
                                placeholder="Email của bạn..."
                                className="bg-white border border-gray-300 rounded-md px-3 py-2 text-[12px] outline-none focus:border-[#0071E3] transition-colors"
                            />
                            <button type="button" className="bg-[#1D1D1F] text-white py-2 rounded-md text-[12px] font-bold hover:bg-black transition-all">
                                Đăng ký ngay
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Footer: Copyright & Legal */}
                <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-gray-400 font-medium">
                    <p>© 2026 STU Learning Project. Được thực hiện bởi Chu Văn Lộc.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-[#1D1D1F]">Chính sách bảo mật</a>
                        <a href="#" className="hover:text-[#1D1D1F]">Điều khoản dịch vụ</a>
                        <a href="#" className="hover:text-[#1D1D1F]">Quy định hoàn tiền</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}