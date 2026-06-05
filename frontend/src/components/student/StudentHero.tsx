import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, PlayCircle } from 'lucide-react';

type StudentHeroProps = {
  title: string;
  subtitle: string;
  description: string;
  primaryHref: string;
  secondaryHref: string;
  image: string;
};

export default function StudentHero({
  title,
  subtitle,
  description,
  primaryHref,
  secondaryHref,
  image,
}: StudentHeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <img src={image} alt="" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">{subtitle}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              <BookOpen size={16} />
              Xem khóa học
            </Link>
            <Link
              to={secondaryHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <PlayCircle size={16} />
              Tìm hiểu thêm
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-2xl">
            <img src="/assets/images/course-1.jpg" alt="Student preview" className="h-[420px] w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -left-6 max-w-[240px] rounded-2xl border border-white/10 bg-slate-900/90 p-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">Học tập có định hướng</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Bố cục tập trung vào nội dung học, khóa học và lộ trình của học viên.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
