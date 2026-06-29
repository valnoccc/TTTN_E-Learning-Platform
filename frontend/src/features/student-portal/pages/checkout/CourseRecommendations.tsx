import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../../api/axios';
import { toAbsoluteApiUrl } from '../../../../config/api';

interface Course {
  maKH: number;
  tenKhoaHoc: string;
  hinhAnh: string;
  moTa: string;
  giaBan: number;
  averageRating: string;
}

interface CrossSellVoucher {
  code: string;
  discount: number;
  discountType: 'PERCENT' | 'AMOUNT';
}

interface RecommendationsData {
  recommendations: Course[];
  crossSellVoucher: CrossSellVoucher | null;
}

export default function CourseRecommendations({ courseId, userId }: { courseId: number, userId?: number }) {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId) return;
    const fetchRecommendations = async () => {
      try {
        const url = userId 
          ? `/public/courses/${courseId}/recommendations?userId=${userId}` 
          : `/public/courses/${courseId}/recommendations`;
        
        const response: any = await axiosClient.get(url);
        if (response && response.recommendations) {
          setData(response);
          if (response.crossSellVoucher) {
            localStorage.setItem('edumeo_cross_sell', JSON.stringify({
              allowedCourseIds: response.recommendations.map((c: Course) => c.maKH),
              courses: response.recommendations,
              couponCode: response.crossSellVoucher.code,
              expiresAt: Date.now() + 30 * 60 * 1000
            }));
          }
        } else if (response?.data?.recommendations) {
          // Fallback if it's wrapped
          setData(response.data);
          if (response.data.crossSellVoucher) {
            localStorage.setItem('edumeo_cross_sell', JSON.stringify({
              allowedCourseIds: response.data.recommendations.map((c: Course) => c.maKH),
              courses: response.data.recommendations,
              couponCode: response.data.crossSellVoucher.code,
              expiresAt: Date.now() + 30 * 60 * 1000
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [courseId, userId]);

  if (loading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return null;
  }

  const { recommendations, crossSellVoucher } = data;

  return (
    <div className="mt-12 text-left w-full max-w-5xl mx-auto px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">✨</span> Gợi ý dành riêng cho bạn
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((course) => {
          const rawImage = course.hinhAnh;
          const imageUrl = rawImage ? (rawImage.startsWith('http') ? rawImage : `/assets/images/${rawImage}`) : '/assets/images/course-1.jpg';
          let newPrice = course.giaBan;
          
          if (crossSellVoucher) {
            if (crossSellVoucher.discountType === 'PERCENT') {
              newPrice = course.giaBan - (course.giaBan * crossSellVoucher.discount) / 100;
            } else {
              newPrice = Math.max(0, course.giaBan - crossSellVoucher.discount);
            }
          }

          return (
            <div 
              key={course.maKH} 
              onClick={() => navigate(`/course-details/${course.maKH}`)}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col"
            >
              {/* Ribbon */}
              {crossSellVoucher && (
                <div className="absolute top-3 left-0 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-r-lg shadow-md transform -translate-x-1 group-hover:translate-x-0 transition-transform">
                    🔥 Giảm {crossSellVoucher.discountType === 'PERCENT' ? `${crossSellVoucher.discount}%` : `${crossSellVoucher.discount.toLocaleString('vi-VN')}đ`}
                    <div className="text-[10px] opacity-90 mt-0.5">Mã: {crossSellVoucher.code}</div>
                  </div>
                </div>
              )}

              <div className="relative aspect-video overflow-hidden bg-gray-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={course.tenKhoaHoc}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50" />
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                  <span>⭐</span> {course.averageRating}
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {course.tenKhoaHoc}
                </h3>
                
                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                  {crossSellVoucher && course.giaBan > 0 ? (
                    <div>
                      <div className="text-xs text-gray-400 line-through mb-0.5">
                        {course.giaBan.toLocaleString('vi-VN')}đ
                      </div>
                      <div className="text-sm font-bold text-red-500">
                        {newPrice.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-gray-800">
                      {course.giaBan === 0 ? 'Miễn phí' : `${course.giaBan.toLocaleString('vi-VN')}đ`}
                    </div>
                  )}
                  
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-purple-100 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
