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

function StatusIcon({ state }: { state: 'success' | 'pending' | 'failed' }) {
  const commonProps = {
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2.2,
  } as const;

  if (state === 'success') {
    return (
      <svg className="h-6 w-6 text-emerald-600" aria-hidden="true" {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  if (state === 'pending') {
    return (
      <svg className="h-6 w-6 text-amber-600" aria-hidden="true" {...commonProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m4 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }

  return (
    <svg className="h-6 w-6 text-rose-600" aria-hidden="true" {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ActionButton({
  children,
  onClick,
  variant = 'secondary',
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles =
    variant === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-400 shadow-sm'
      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-300';

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

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
      <div className="min-h-screen bg-stone-50 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/5">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Đang xác nhận thanh toán
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Hệ thống đang kiểm tra kết quả từ MoMo
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
              Vui lòng chờ trong giây lát. Hóa đơn sẽ được cập nhật ngay khi giao dịch
              được đồng bộ xong.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (returnState === 'PAID') {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-8 sm:p-10">
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  <StatusIcon state="success" />
                  Thanh toán thành công
                </div>

                <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Ghi danh hoàn tất
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  MoMo đã xác nhận giao dịch và khóa học đã được thêm vào tài khoản của bạn.
                  Bạn có thể vào học ngay hoặc xem lại lịch sử thanh toán bất cứ lúc nào.
                </p>

                {displayMessage && (
                  <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-900">
                    {displayMessage}
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ActionButton onClick={() => navigate('/student/my-courses')} variant="primary">
                    Vào học ngay
                  </ActionButton>
                  <ActionButton onClick={() => navigate('/student/profile?tab=payments')}>
                    Xem lịch sử thanh toán
                  </ActionButton>
                </div>
              </div>

              <aside className="border-t border-stone-200 bg-stone-50/70 p-8 sm:p-10 lg:border-l lg:border-t-0">
                <p className="text-sm font-medium text-slate-500">Tóm tắt giao dịch</p>

                <dl className="mt-5 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-slate-500">Trạng thái</dt>
                    <dd className="text-sm font-semibold text-emerald-700">Thành công</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-slate-500">Phương thức</dt>
                    <dd className="text-sm font-medium text-slate-900">MoMo</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-slate-500">Số khóa học</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {parsedCourseIds.length > 0 ? `${parsedCourseIds.length} khóa học` : 'Không xác định'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-slate-500">Đồng bộ giỏ hàng</dt>
                    <dd className="text-sm font-medium text-slate-900">Đã cập nhật</dd>
                  </div>
                </dl>

                {parsedCourseIds.length > 0 && (
                  <div className="mt-8">
                    <p className="text-sm font-medium text-slate-500">Mã khóa học</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parsedCourseIds.map((courseId) => (
                        <span
                          key={courseId}
                          className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                        >
                          #{courseId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>

          {parsedCourseId && (
            <CourseRecommendations
              courseId={parsedCourseId}
              userId={parsedUserId || undefined}
            />
          )}
        </main>
      </div>
    );
  }

  if (returnState === 'PENDING') {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <StatusIcon state="pending" />
              Đang xử lý
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
              Thanh toán đang được xác nhận
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              MoMo chưa trả về trạng thái cuối cùng. Hóa đơn sẽ được cập nhật khi hệ thống
              nhận đủ kết quả xác nhận.
            </p>
            {displayMessage && (
              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900">
                {displayMessage}
              </div>
            )}
            <div className="mt-8">
              <ActionButton onClick={() => navigate('/student/profile?tab=payments')}>
                Xem lịch sử thanh toán
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div
            className="inline-flex items-center gap-3 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
          >
            <StatusIcon state="failed" />
            Thanh toán thất bại
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
            Thanh toán không thành công
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Thanh toán chưa hoàn tất và khóa học chưa được ghi danh vào tài khoản của bạn.
          </p>
          {displayMessage && (
            <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm leading-6 text-rose-900">
              {displayMessage}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionButton onClick={() => navigate('/student')}>
              Về trang chủ
            </ActionButton>
            <ActionButton onClick={() => navigate('/student/profile?tab=payments')}>
              Xem lịch sử thanh toán
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
