import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CourseRecommendations from './CourseRecommendations';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [parsedCourseId, setParsedCourseId] = useState<number | null>(null);
  const [parsedUserId, setParsedUserId] = useState<number | null>(null);

  const resultCode = searchParams.get('resultCode');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');
  const extraData = searchParams.get('extraData');

  useEffect(() => {
    console.log('[CheckoutSuccess] resultCode:', resultCode, '| message:', message, '| orderId:', orderId, '| extraData:', extraData);

    let extractedCourseId: number | null = null;
    let extractedUserId: number | null = null;
    
    // Bóc tách dữ liệu từ extraData của MoMo
    if (extraData) {
      try {
        const decodedString = atob(extraData);
        const parsedData = JSON.parse(decodedString);
        
        if (parsedData.courseIds && Array.isArray(parsedData.courseIds) && parsedData.courseIds.length > 0) {
          extractedCourseId = Number(parsedData.courseIds[0]);
        } else if (parsedData.courseId) {
          extractedCourseId = Number(parsedData.courseId);
        }

        if (parsedData.userId) {
          extractedUserId = Number(parsedData.userId);
        }
      } catch (e) {
        console.error('[CheckoutSuccess] Lỗi giải mã extraData:', e);
      }
    }

    // Dự phòng lấy từ courseId nếu có (cho luồng test nội bộ)
    if (!extractedCourseId) {
      const rawCourseId = searchParams.get('courseId');
      if (rawCourseId && !isNaN(Number(rawCourseId))) {
        extractedCourseId = Number(rawCourseId);
      }
    }

    if (extractedCourseId) {
      console.log('[CheckoutSuccess] Đã bóc tách courseId thành công:', extractedCourseId);
      setParsedCourseId(extractedCourseId);
    }
    if (extractedUserId) {
      setParsedUserId(extractedUserId);
    }
  }, [searchParams, resultCode, message, orderId, extraData]);

  // Đã bỏ auto-redirect để user có thời gian đọc gợi ý khóa học (cross-sell)
  /* 
  useEffect(() => {
    if (resultCode !== '0') return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resultCode]);

  useEffect(() => {
    if (countdown === 0 && resultCode === '0') {
      navigate('/student/profile');
    }
  }, [countdown, resultCode, navigate]);
  */

  // 1. THANH TOÁN THÀNH CÔNG
  if (resultCode === '0') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center relative overflow-hidden z-10">
          {/* Decorative background blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-100 rounded-full opacity-50 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-100 rounded-full opacity-50 pointer-events-none" />

          {/* Success icon */}
          <div className="relative mx-auto mb-6 w-28 h-28">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center shadow-xl animate-bounce-slow">
              <svg
                className="w-14 h-14 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Confetti emoji row */}
          <div className="flex justify-center gap-2 text-2xl mb-4 animate-pulse">
            🎉 🎓 🎊
          </div>

          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            Chúc mừng bạn!
          </h1>
          <p className="text-gray-500 mb-1 text-base">
            Thanh toán MoMo <span className="font-semibold text-green-500">thành công</span>.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Khóa học đã được ghi danh vào tài khoản của bạn.
            Hãy bắt đầu học ngay hôm nay! 🚀
          </p>

          {/* MoMo logo badge */}
          <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-full px-4 py-2 mb-8">
            <img
              src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
              alt="MoMo"
              className="w-5 h-5 rounded"
            />
            <span className="text-pink-600 text-sm font-medium">Thanh toán qua MoMo</span>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={() => navigate('/student/my-courses')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              🎓 Vào học ngay
            </button>
            <button
              onClick={() => navigate('/student/profile')}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-purple-300 text-gray-600 hover:text-purple-600 font-semibold transition-all duration-200"
            >
              Xem hồ sơ của tôi
            </button>
          </div>
        </div>

        {/* Phần Recommend khóa học (Cross-selling) */}
        {parsedCourseId && <CourseRecommendations courseId={parsedCourseId} userId={parsedUserId || undefined} />}

        {/* Tailwind custom animation */}
        <style>{`
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // 2. NGƯỜI DÙNG TỰ HUỶ GIAO DỊCH
  if (resultCode === '1006') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
          <div className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-orange-100">
            <svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Thanh toán đã bị hủy
          </h1>
          <p className="text-gray-500 mb-2 text-sm">
            Bạn đã chủ động hủy giao dịch này.
          </p>
          {message && (
            <p className="text-xs rounded-lg px-3 py-2 mb-6 text-orange-600 bg-orange-50">
              {decodeURIComponent(message)}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200">
              ← Thử lại
            </button>
            <button onClick={() => navigate('/student')} className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg">
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. CÁC LỖI KHÁC (TIMEOUT, SAI MÃ PIN...)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
        <div className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-red-100">
          <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Thanh toán thất bại
        </h1>
        <p className="text-gray-500 mb-2 text-sm">
          Giao dịch của bạn không thành công. Vui lòng thử lại.
        </p>
        {message && (
          <p className="text-xs rounded-lg px-3 py-2 mb-6 text-red-600 bg-red-50">
            {decodeURIComponent(message)}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200">
            ← Thử lại
          </button>
          <button onClick={() => navigate('/student')} className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg">
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
