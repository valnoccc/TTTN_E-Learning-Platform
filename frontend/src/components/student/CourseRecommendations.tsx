import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecommendedCourse {
    maKH: number;
    tenKhoaHoc: string;
    giaBan: number;
    hinhThuNho: string | null;
    tenDM: string;
    tenGiangVien: string;
    averageRating: string;
    totalLessons: number;
}

interface SuggestedCoupon {
    code: string;
    discount: number;
    loaiKM: string;
}

interface RecommendationsData {
    courses: RecommendedCourse[];
    suggestedCoupon: SuggestedCoupon | null;
}

interface Props {
    purchasedCourseId: number | null;
    currentUserId?: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
    if (price === 0) return 'Miễn phí';
    return price.toLocaleString('vi-VN') + 'đ';
}

function StarRating({ rating }: { rating: string }) {
    const num = parseFloat(rating) || 0;
    const stars = Math.round(num);
    return (
        <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s}
                    className={`w-3 h-3 ${s <= stars ? 'text-yellow-400' : 'text-slate-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="ml-1 text-[11px] text-slate-500 font-medium">{num.toFixed(1)}</span>
        </span>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseRecommendations({ purchasedCourseId, currentUserId }: Props) {
    const navigate = useNavigate();
    const [data, setData] = useState<RecommendationsData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!purchasedCourseId || isNaN(purchasedCourseId)) return;

        setLoading(true);
        const params = new URLSearchParams();
        if (currentUserId) params.set('userId', String(currentUserId));

        axiosClient
            .get(`/public/courses/${purchasedCourseId}/recommendations?${params.toString()}`)
            .then((response: any) => {
                const payload = response?.data ?? response;
                setData(payload);
            })
            .catch((err: any) => {
                console.error('[CourseRecommendations] Lỗi lấy gợi ý:', err?.message);
            })
            .finally(() => setLoading(false));
    }, [purchasedCourseId, currentUserId]);

    // Không hiển thị nếu không có courseId hoặc đang tải nhưng chưa có data
    if (!purchasedCourseId) return null;

    // Skeleton loader
    if (loading) {
        return (
            <div className="mt-8 w-full max-w-4xl mx-auto px-4">
                <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-lg mb-4 mx-auto" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
                            <div className="h-32 bg-slate-200 animate-pulse" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 bg-slate-200 animate-pulse rounded" />
                                <div className="h-3 bg-slate-100 animate-pulse rounded w-2/3" />
                                <div className="h-4 bg-slate-200 animate-pulse rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.courses.length === 0) return null;

    const { courses, suggestedCoupon } = data;

    return (
        <div className="mt-8 w-full max-w-4xl mx-auto px-4">
            {/* Section header */}
            <div className="text-center mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                    Dành riêng cho bạn
                </p>
                <h2 className="text-xl font-extrabold text-slate-800">
                    👥 Những học viên mua khoá này cũng chọn
                </h2>
                {suggestedCoupon && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200 animate-pulse">
                        🔥 Giảm ngay {suggestedCoupon.discount}% khi mua kèm — Nhập mã:{' '}
                        <span className="font-mono text-base tracking-wider bg-white/20 px-2 py-0.5 rounded-lg">
                            {suggestedCoupon.code}
                        </span>
                    </div>
                )}
            </div>

            {/* Course grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {courses.map((course) => (
                    <div
                        key={course.maKH}
                        onClick={() => navigate(`/courses/${course.maKH}`)}
                        className="group relative rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                        id={`rec-course-${course.maKH}`}
                    >
                        {/* Thumbnail */}
                        <div className="relative overflow-hidden aspect-video bg-gradient-to-br from-indigo-100 to-purple-100">
                            {course.hinhThuNho ? (
                                <img
                                    src={course.hinhThuNho}
                                    alt={course.tenKhoaHoc}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                    🎓
                                </div>
                            )}

                            {/* Coupon badge overlay */}
                            {suggestedCoupon && (
                                <div className="absolute top-2 left-2 right-2">
                                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-lg shadow-lg leading-tight">
                                        🔥 -{suggestedCoupon.discount}% mua kèm
                                        <br />
                                        <span className="font-mono opacity-90">Mã: {suggestedCoupon.code}</span>
                                    </div>
                                </div>
                            )}

                            {/* Category badge */}
                            <div className="absolute bottom-2 right-2">
                                <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                                    {course.tenDM}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                            <h3 className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                {course.tenKhoaHoc}
                            </h3>
                            <p className="mt-1 text-[11px] text-slate-500 truncate">
                                {course.tenGiangVien}
                            </p>

                            <div className="mt-2">
                                <StarRating rating={course.averageRating} />
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-[14px] font-black text-emerald-600">
                                    {formatPrice(course.giaBan)}
                                </span>
                                {suggestedCoupon && course.giaBan > 0 && (
                                    <span className="text-[11px] text-red-500 font-bold">
                                        -{suggestedCoupon.discount}%
                                    </span>
                                )}
                            </div>

                            {course.totalLessons > 0 && (
                                <p className="mt-1 text-[10px] text-slate-400">
                                    {course.totalLessons} bài học
                                </p>
                            )}
                        </div>

                        {/* Hover CTA */}
                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none rounded-2xl" />
                    </div>
                ))}
            </div>

            {/* Bottom coupon reminder */}
            {suggestedCoupon && (
                <div className="mt-5 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 px-5 py-4 flex items-center gap-4">
                    <div className="text-3xl shrink-0">🎁</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-slate-800">
                            Ưu đãi đặc biệt dành cho bạn!
                        </p>
                        <p className="text-[13px] text-slate-600 mt-0.5">
                            Giảm ngay <strong>{suggestedCoupon.discount}%</strong> cho bất kỳ khóa học nào bên trên.
                            Nhập mã <span className="font-mono font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">{suggestedCoupon.code}</span> khi thanh toán.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
