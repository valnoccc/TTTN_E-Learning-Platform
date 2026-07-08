import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, ExternalLink, CalendarDays } from 'lucide-react';
import axiosClient from '../../../../api/axios';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Certificate {
  certificateId: string;
  issuedDate: string;
  courseId: number;
  courseName: string;
  thumbnail: string | null;
  instructorName: string;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-2/5" />
        <div className="h-9 bg-slate-200 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ─── Certificate Card ─────────────────────────────────────────────────────────
function CertificateCard({ cert }: { cert: Certificate }) {
  const formattedDate = cert.issuedDate
    ? new Date(cert.issuedDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col">
      {/* Thumbnail */}
      <div className="h-32 w-full overflow-hidden bg-slate-100 relative shrink-0">
        {cert.thumbnail ? (
          <img
            src={cert.thumbnail}
            alt={cert.courseName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
            <BookOpen size={32} className="text-purple-300" />
          </div>
        )}
        {/* Badge */}
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
          <Award size={9} />
          Đã nhận
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Course name */}
        <h4
          className="font-bold text-slate-800 mb-1 line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors"
          title={cert.courseName}
        >
          {cert.courseName}
        </h4>

        {/* Instructor */}
        <p className="text-xs text-slate-400 mb-2 truncate">
          Giảng viên: <span className="font-medium text-slate-500">{cert.instructorName}</span>
        </p>

        {/* Issued date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <CalendarDays size={12} className="text-purple-400 shrink-0" />
          <span>Cấp ngày: <span className="font-semibold text-slate-600">{formattedDate}</span></span>
        </div>

        {/* CTA button */}
        <Link
          to={`/certificate/${cert.certificateId}`}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          <Award size={15} />
          Xem chứng chỉ
          <ExternalLink size={12} className="opacity-70" />
        </Link>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center">
          <Award size={44} className="text-purple-200" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-base">🎓</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-700 mb-2">
        Bạn chưa có chứng chỉ nào
      </h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
        Hãy hoàn thành khóa học để nhận chứng chỉ và ghi lại thành tích học tập của bạn nhé!
      </p>
      <Link
        to="/course-grid"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        <BookOpen size={15} />
        Khám phá khóa học
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentCertificates() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const res: any = await axiosClient.get('/users/me/certificates');
        // Chuẩn hóa response dù axiosClient có unwrap hay không
        const data: Certificate[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setCertificates(data);
      } catch (err: any) {
        console.error('[StudentCertificates] Lỗi tải danh sách chứng chỉ:', err);
        setError('Không thể tải danh sách chứng chỉ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award size={24} className="text-purple-600" />
            Chứng chỉ của tôi
          </h3>
          {!loading && certificates.length > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">
              Bạn đã nhận{' '}
              <span className="font-semibold text-purple-600">{certificates.length}</span>{' '}
              chứng chỉ
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && certificates.length === 0 && <EmptyState />}

      {/* Certificate grid */}
      {!loading && !error && certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <CertificateCard key={cert.certificateId} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
