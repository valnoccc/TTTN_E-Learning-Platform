import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // MoMo redirect trả về resultCode trong query params
    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message');
    const orderId = searchParams.get('orderId');

    console.log('[CheckoutSuccess] resultCode:', resultCode, '| message:', message, '| orderId:', orderId);

    if (resultCode === '0') {
      setIsSuccess(true);
    } else if (resultCode !== null) {
      // MoMo có resultCode khác 0 => thất bại / bị huỷ
      setIsSuccess(false);
    } else {
      // Không có query param => trang được truy cập trực tiếp => coi là thành công (từ redirect nội bộ)
      setIsSuccess(true);
    }
  }, [searchParams]);

  // Đếm ngược tự động điều hướng khi thành công
  useEffect(() => {
    if (isSuccess !== true) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/student/profile');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  if (isSuccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
          {/* Icon thất bại */}
          <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-500 mb-2 text-sm">
            Giao dịch của bạn không thành công hoặc đã bị huỷ.
          </p>
          {searchParams.get('message') && (
            <p className="text-red-400 text-xs bg-red-50 rounded-lg px-3 py-2 mb-6">
              {decodeURIComponent(searchParams.get('message') || '')}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200"
            >
              ← Thử lại
            </button>
            <button
              onClick={() => navigate('/student')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center relative overflow-hidden">

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

        {/* Countdown */}
        <p className="text-gray-400 text-xs">
          Tự động chuyển đến hồ sơ sau{' '}
          <span className="font-bold text-purple-500">{countdown}s</span>...
        </p>
      </div>

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
