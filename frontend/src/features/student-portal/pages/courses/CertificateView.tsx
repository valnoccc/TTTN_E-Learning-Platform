import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Share2,
  Star,
  Clock,
  BookOpen,
  User,
  ChevronLeft,
  Award,
} from 'lucide-react';
import axiosClient from '../../../../api/axios';

// ─── Certificate Template (khung chứng chỉ A4 ngang) ─────────────────────────
interface CertificateTemplateProps {
  studentName: string;
  courseName: string;
  instructorName: string;
  issuedDate: string;
  certificateId: string;
  totalHours?: number;
}

function CertificateTemplate({
  studentName,
  courseName,
  instructorName,
  issuedDate,
  certificateId,
  totalHours,
}: CertificateTemplateProps) {
  return (
    <div
      id="certificate-printable"
      className="relative bg-white overflow-hidden border border-gray-200"
      style={{ width: '100%', aspectRatio: '297/210', padding: '3.5rem 4rem' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start w-full">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            Edu<span className="text-purple-600">meo</span>
          </span>
        </div>
        <div className="text-right text-[9px] text-gray-400 space-y-0.5 font-medium leading-tight mt-1">
          <p>Số giấy chứng nhận: {certificateId}</p>
          <p>URL giấy chứng nhận: {window.location.origin}/certificate/{certificateId}</p>
          <p>Số tham chiếu: {(certificateId || '').slice(-4).padStart(4, '0')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-12">
        <p className="text-xs text-gray-500 tracking-[0.15em] uppercase font-semibold mb-3">
          Giấy chứng nhận hoàn thành
        </p>
        <h1 className="text-5xl font-extrabold text-black leading-[1.1] max-w-4xl break-words">
          {courseName || 'Khóa học'}
        </h1>
        <p className="mt-3 text-[13px] font-medium text-gray-700">
          Giảng viên <span className="font-bold text-black">{instructorName || '—'}</span>
        </p>
      </div>

      <div className="mt-16">
        <h2 className="text-4xl font-bold text-black mb-3">
          {studentName || 'Học viên'}
        </h2>
        <div className="flex flex-col gap-0.5 text-xs text-gray-600 font-medium">
          <p>Ngày <span className="font-bold text-black">{issuedDate}</span></p>
          <p>Thời lượng <span className="font-bold text-black">Tổng số {totalHours ?? 0} giờ</span></p>
        </div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-10 left-16 right-16">
        <p className="text-[10px] text-gray-400 leading-relaxed max-w-4xl">
          Giấy chứng nhận trên xác nhận rằng {studentName || 'Học viên'} đã hoàn thành thành công khóa học {courseName || 'Khóa học'} vào ngày {issuedDate} do {instructorName || 'Giảng viên'} giảng dạy trên Edumeo. Giấy chứng nhận cho thấy toàn bộ khóa học đã được hoàn thành và được học viên xác nhận. Thời lượng khóa học thể hiện tổng số giờ của các video và bài giảng bằng văn bản của khóa học tại thời điểm hoàn thành gần nhất.
        </p>
      </div>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-200'}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1 font-medium">{rating?.toFixed(1) ?? '—'}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CertificateView() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        // Gọi đúng route backend: GET /users/me/certificates/by-id/:certificateId
        const res: any = await axiosClient.get(
          `/users/me/certificates/by-id/${id}`,
        );
        // Chuẩn hóa response dù axiosClient có unwrap hay không
        const data = res?.certificateId
          ? res                        // đã unwrap
          : res?.data?.certificateId
          ? res.data                   // chưa unwrap (axios raw)
          : res?.data ?? res;          // fallback
        setCertData(data);
      } catch (err: any) {
        console.error('[CertificateView] Lỗi tải chứng chỉ:', err);
        setError('Không tìm thấy chứng chỉ. Vui lòng kiểm tra lại đường dẫn.');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [id]);


  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Chứng chỉ của tôi - Edumeo', url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Đã sao chép liên kết chứng chỉ!');
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Đang tải chứng chỉ...</p>
        </div>
      </div>
    );
  }

  // ── Error / fallback data ──────────────────────────────────────────────────
  // Nếu API chưa có, hiển thị mock để giao diện luôn đẹp
  const cert = certData ?? {
    studentName: 'Học viên Edumeo',
    courseName: 'Khóa học mẫu',
    instructorName: 'Giảng viên',
    issuedDate: new Date().toLocaleDateString('vi-VN'),
    certificateId: id ?? 'DEMO-0000',
    rating: 4.8,
    totalHours: 12,
    totalLessons: 48,
    thumbnail: null,
    studentAvatar: null,
  };

  const issuedDateFormatted = cert.issuedDate
    ? new Date(cert.issuedDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-printable, #certificate-printable * { visibility: visible; }
          #certificate-printable {
            position: fixed;
            top: 0; left: 0;
            width: 100vw;
            aspect-ratio: 297 / 210;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium"
            >
              <ChevronLeft size={16} />
              Trang chủ
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Award size={14} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 text-sm">
                Edu<span className="text-purple-600">meo</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Page heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Award size={24} className="text-purple-600" />
              Giấy chứng nhận hoàn thành
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Xem, tải xuống hoặc chia sẻ thành tích của bạn.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
              ⚠️ {error} — Đang hiển thị bản xem trước mẫu.
            </div>
          )}

          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── Left column: Certificate (8/12) ──────────────────────── */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Certificate frame */}
              <div className="border border-gray-200 shadow-md rounded-xl overflow-hidden bg-white">
                <CertificateTemplate
                  studentName={cert.studentName}
                  courseName={cert.courseName}
                  instructorName={cert.instructorName}
                  issuedDate={issuedDateFormatted}
                  certificateId={cert.certificateId}
                  totalHours={cert.totalHours}
                />
              </div>

              {/* Verification note */}
              <p className="text-xs text-slate-400 leading-relaxed px-1">
                Giấy chứng nhận xác nhận rằng{' '}
                <span className="font-semibold text-slate-600">{cert.studentName}</span> đã hoàn
                thành thành công khóa học{' '}
                <span className="font-semibold text-slate-600">"{cert.courseName}"</span> vào ngày{' '}
                <span className="font-semibold text-slate-600">{issuedDateFormatted}</span>. Tài
                liệu này được cấp bởi nền tảng Edumeo và có giá trị xác thực thông qua mã chứng
                chỉ.
              </p>

              {/* Action buttons (visible on mobile below cert) */}
              <div className="flex gap-3 lg:hidden">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 border border-purple-600 text-purple-600 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-purple-50 transition-colors"
                >
                  <Download size={15} /> Tải xuống
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 border border-purple-600 text-purple-600 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-purple-50 transition-colors"
                >
                  <Share2 size={15} /> Chia sẻ
                </button>
              </div>
            </div>

            {/* ── Right column: Sidebar info (4/12) ────────────────────── */}
            <div className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-20">
              {/* Block 1 – Student info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Người nhận giấy chứng nhận
                </h3>
                <div className="flex items-center gap-3">
                  {cert.studentAvatar ? (
                    <img
                      src={cert.studentAvatar}
                      alt={cert.studentName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center ring-2 ring-purple-100 shrink-0">
                      <User size={22} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 text-base leading-tight">
                      {cert.studentName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Học viên Edumeo</p>
                  </div>
                </div>
              </div>

              {/* Block 2 – Course info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Giới thiệu về khóa học
                </h3>

                {/* Thumbnail */}
                {cert.thumbnail ? (
                  <img
                    src={cert.thumbnail}
                    alt={cert.courseName}
                    className="w-full h-36 object-cover rounded-xl mb-4 border border-gray-100"
                  />
                ) : (
                  <div className="w-full h-36 rounded-xl mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border border-purple-100">
                    <BookOpen size={36} className="text-purple-300" />
                  </div>
                )}

                <p className="font-bold text-slate-800 text-sm leading-snug mb-1">
                  {cert.courseName}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Bởi{' '}
                  <span className="font-semibold text-purple-600">{cert.instructorName}</span>
                </p>

                <StarRating rating={cert.rating} />

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={13} className="text-purple-400" />
                    <span>{cert.totalHours ?? '—'} giờ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <BookOpen size={13} className="text-purple-400" />
                    <span>{cert.totalLessons ?? '—'} bài giảng</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="hidden lg:flex flex-col gap-3">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 border border-purple-600 text-purple-600 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-purple-50 transition-colors"
                >
                  <Download size={16} />
                  Tải xuống
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 border border-purple-600 text-purple-600 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-purple-50 transition-colors"
                >
                  <Share2 size={16} />
                  Chia sẻ
                </button>
              </div>

              {/* Certificate ID badge */}
              <div className="bg-purple-50 rounded-xl border border-purple-100 px-4 py-3">
                <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-1">
                  Mã chứng chỉ
                </p>
                <p className="text-xs font-mono text-purple-700 break-all">
                  {cert.certificateId ?? id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
