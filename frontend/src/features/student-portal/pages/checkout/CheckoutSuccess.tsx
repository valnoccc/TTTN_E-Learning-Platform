import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MomoPaymentStatus, syncMomoReturn } from '../../../../api/checkout';
import { removeFromCart } from '../../../cart/cartSlice';
import CourseRecommendations from './CourseRecommendations';

type ReturnState = MomoPaymentStatus | 'CHECKING' | 'UNKNOWN';

const getDecodedMessage = (message: string | null) => {
  if (!message) return '';
  try {
    return decodeURIComponent(message);
  } catch {
    return message;
  }
};

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [returnState, setReturnState] = useState<ReturnState>('CHECKING');
  const [displayMessage, setDisplayMessage] = useState('');
  const [parsedCourseId, setParsedCourseId] = useState<number | null>(null);
  const [parsedCourseIds, setParsedCourseIds] = useState<number[]>([]);
  const [parsedUserId, setParsedUserId] = useState<number | null>(null);

  const resultCode = searchParams.get('resultCode');
  const message = searchParams.get('message');
  const extraData = searchParams.get('extraData');
  const returnPayload = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams],
  );

  useEffect(() => {
    let extractedCourseIds: number[] = [];
    let extractedUserId: number | null = null;

    if (extraData) {
      try {
        const parsedData = JSON.parse(atob(extraData));

        if (Array.isArray(parsedData.courseIds)) {
          extractedCourseIds = parsedData.courseIds
            .map((id: unknown) => Number(id))
            .filter((id: number) => Number.isFinite(id));
        } else if (parsedData.courseId) {
          const singleCourseId = Number(parsedData.courseId);
          if (Number.isFinite(singleCourseId)) {
            extractedCourseIds = [singleCourseId];
          }
        }

        if (parsedData.userId) {
          const userId = Number(parsedData.userId);
          extractedUserId = Number.isFinite(userId) ? userId : null;
        }
      } catch (error) {
        console.error('[CheckoutSuccess] Cannot decode MoMo extraData:', error);
      }
    }

    if (extractedCourseIds.length === 0) {
      const rawCourseId = searchParams.get('courseId');
      const fallbackCourseId = rawCourseId ? Number(rawCourseId) : NaN;
      if (Number.isFinite(fallbackCourseId)) {
        extractedCourseIds = [fallbackCourseId];
      }
    }

    setParsedCourseIds(extractedCourseIds);
    setParsedCourseId(extractedCourseIds[0] ?? null);
    setParsedUserId(extractedUserId);
  }, [extraData, searchParams]);

  useEffect(() => {
    const hasSignedMomoReturn =
      Boolean(returnPayload.signature) && Boolean(returnPayload.extraData);

    if (!hasSignedMomoReturn) {
      if (resultCode === '0') {
        setReturnState('PENDING');
      } else {
        setReturnState('FAILED');
      }
      setDisplayMessage(getDecodedMessage(message));
      return;
    }

    let cancelled = false;
    setReturnState('CHECKING');

    syncMomoReturn(returnPayload)
      .then((response) => {
        if (cancelled) return;
        setReturnState(response.paymentStatus);
        setDisplayMessage(response.message || getDecodedMessage(message));
      })
      .catch((error: any) => {
        if (cancelled) return;
        console.error('[CheckoutSuccess] Cannot sync MoMo return:', error);
        setReturnState(resultCode === '0' ? 'PENDING' : 'FAILED');
        setDisplayMessage(
          error.response?.data?.message ||
            getDecodedMessage(message) ||
            'Không thể xác nhận kết quả thanh toán từ MoMo.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [message, resultCode, returnPayload]);

  useEffect(() => {
    if (returnState !== 'PAID') return;

    parsedCourseIds.forEach((courseId) => {
      dispatch(removeFromCart(courseId));
    });
  }, [dispatch, parsedCourseIds, returnState]);

  if (returnState === 'CHECKING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
          <div className="mx-auto mb-6 w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Đang xác nhận thanh toán
          </h1>
          <p className="text-gray-500 text-sm">
            Hệ thống đang kiểm tra kết quả trả về từ MoMo. Vui lòng chờ trong giây lát.
          </p>
        </div>
      </div>
    );
  }

  if (returnState === 'PAID') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center relative overflow-hidden z-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-100 rounded-full opacity-50 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-100 rounded-full opacity-50 pointer-events-none" />

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

          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            Chúc mừng bạn!
          </h1>
          <p className="text-gray-500 mb-1 text-base">
            Thanh toán MoMo <span className="font-semibold text-green-500">thành công</span>.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Khóa học đã được ghi danh vào tài khoản của bạn.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={() => navigate('/student/my-courses')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Vào học ngay
            </button>
            <button
              onClick={() => navigate('/student/profile')}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-purple-300 text-gray-600 hover:text-purple-600 font-semibold transition-all duration-200"
            >
              Xem hồ sơ của tôi
            </button>
          </div>
        </div>

        {parsedCourseId && (
          <CourseRecommendations courseId={parsedCourseId} userId={parsedUserId || undefined} />
        )}

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

  if (returnState === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
          <div className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-amber-100">
            <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Thanh toán đang được xử lý
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            MoMo chưa xác nhận hoàn tất giao dịch. Hóa đơn sẽ được cập nhật khi hệ thống nhận được kết quả cuối cùng.
          </p>
          <button onClick={() => navigate('/student/profile')} className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200">
            Xem lịch sử thanh toán
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
        <div className={`mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center ${isCancelled ? 'bg-orange-100' : 'bg-red-100'}`}>
          <svg className={`w-12 h-12 ${isCancelled ? 'text-orange-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isCancelled ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {isCancelled ? 'Thanh toán đã bị hủy' : 'Thanh toán thất bại'}
        </h1>
        <p className="text-gray-500 mb-2 text-sm">
          {isCancelled
            ? 'Bạn đã hủy giao dịch hoặc giao dịch đã bị MoMo hủy.'
            : 'Giao dịch của bạn không thành công. Khóa học chưa được ghi danh.'}
        </p>
        {displayMessage && (
          <p className={`text-xs rounded-lg px-3 py-2 mb-6 ${isCancelled ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50'}`}>
            {displayMessage}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200">
            Thử lại
          </button>
          <button onClick={() => navigate('/student')} className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg">
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
