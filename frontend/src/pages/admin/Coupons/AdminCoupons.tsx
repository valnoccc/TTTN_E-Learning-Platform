import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Percent,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';

import axiosClient from '../../../api/axios';
import Pagination from '../../../components/Pagination';
import AdminLayout from '../../../layouts/AdminLayout';
import {
  type AdminCouponItem,
  type AdminCouponRuleType,
  type CreateAdminCouponPayload,
  type UpdateAdminCouponPayload,
  type LoaiKM,
  type AdminCouponScopeType,
  type QueryCouponsFilter,
  useAdminCoupons,
} from './hooks/useAdminCoupons';
import { type AdminManagedCourse } from '../Courses/hooks/useAdminCourseModeration';
import { type AdminCategoryItem } from '../Categories/hooks/useAdminCategories';
import { type AdminUserRecord } from '../Users/hooks/useAdminUsers';

const LOAI_KM_OPTIONS: { value: LoaiKM; label: string; desc: string }[] = [
  { value: 'FIRST_TIME', label: 'Mua lần đầu', desc: 'Ràng buộc 1 lần / tài khoản' },
  { value: 'CROSS_SELL', label: 'Mua kèm / Cross-sell', desc: 'Tự động áp dụng gợi ý khóa học' },
  { value: 'HOLIDAY', label: 'Dịp lễ / Sự kiện', desc: 'Khuyến mãi theo mùa / sự kiện' },
  { value: 'STANDARD', label: 'Tiêu chuẩn', desc: 'Mã giảm giá thông thường' },
];

const PAGE_SIZE = 10;
const RULE_TYPES_REQUIRING_VALUE: AdminCouponRuleType[] = [
  'COMBO_ONLY',
  'MIN_ORDER_VALUE',
  'MIN_COURSE_COUNT',
  'ACCOUNT_AGE_HOURS',
];

const RULE_OPTIONS: Array<{
  value: AdminCouponRuleType;
  label: string;
  desc: string;
}> = [
  { value: 'FIRST_PURCHASE', label: 'Mua lần đầu', desc: 'Áp dụng cho người mua lần đầu' },
  { value: 'NEW_USER_24H', label: 'Tài khoản 24h', desc: 'Áp dụng cho tài khoản mới tạo trong 24 giờ' },
  { value: 'NEW_USER_ONLY', label: 'Khách mới', desc: 'Tài khoản mới và chưa có giao dịch' },
  { value: 'REPEAT_PURCHASE', label: 'Mua lại', desc: 'Áp dụng cho người đã từng mua' },
  { value: 'COMBO_ONLY', label: 'Combo', desc: 'Cần đủ số lượng khóa học trong giỏ' },
  { value: 'MIN_ORDER_VALUE', label: 'Giá trị tối thiểu', desc: 'Cần đạt ngưỡng giá trị đơn hàng' },
  { value: 'MIN_COURSE_COUNT', label: 'Số khóa tối thiểu', desc: 'Cần đạt số lượng khóa học trong giỏ' },
  { value: 'ACCOUNT_AGE_HOURS', label: 'Tuổi tài khoản', desc: 'Giới hạn theo số giờ kể từ lúc tạo' },
];

const SCOPE_OPTIONS: Array<{
  value: AdminCouponScopeType;
  label: string;
}> = [
  { value: 'ALL', label: 'Toàn sàn' },
  { value: 'COURSE', label: 'Khóa học cụ thể' },
  { value: 'CATEGORY', label: 'Danh mục'},
  { value: 'INSTRUCTOR', label: 'Giảng viên' },
];

type ScopeTargetOption = {
  id: number;
  title: string;
  subtitle: string;
  meta?: string;
};

type CouponForm = {
  maCode: string;
  giaTriGiam: number;
  loaiGiam: 'PERCENT' | 'AMOUNT';
  soLuongGioiHan: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  ghiChu: string;
  trangThai: 'ACTIVE' | 'INACTIVE';
  scopeType: AdminCouponScopeType;
  scopeTargetIds: string;
  rules: Array<{
    loaiDieuKien: AdminCouponRuleType;
    giaTriDieuKien: string;
  }>;
};

const emptyForm: CouponForm = {
  maCode: '',
  giaTriGiam: 20,
  loaiGiam: 'PERCENT',
  soLuongGioiHan: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  ghiChu: '',
  trangThai: 'ACTIVE',
  scopeType: 'ALL',
  scopeTargetIds: '',
  rules: [],
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function requiresRuleValue(loaiDieuKien: AdminCouponRuleType) {
  return RULE_TYPES_REQUIRING_VALUE.includes(loaiDieuKien);
}

function parseTargetIds(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((part) => Number.isInteger(part) && part > 0),
    ),
  );
}

function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`;
}

function formatDiscountValue(loaiGiam: 'PERCENT' | 'AMOUNT', giaTriGiam: number) {
  return loaiGiam === 'PERCENT' ? `${giaTriGiam}%` : formatCurrency(giaTriGiam);
}

function ScopeTargetPicker({
  scopeType,
  loading,
  search,
  onSearchChange,
  visibleOptions,
  selectedOptions,
  selectedIds,
  onToggleTarget,
  emptyHint,
}: {
  scopeType: AdminCouponScopeType;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  visibleOptions: ScopeTargetOption[];
  selectedOptions: ScopeTargetOption[];
  selectedIds: number[];
  onToggleTarget: (option: ScopeTargetOption) => void;
  emptyHint: string;
}) {
  const selectedSet = new Set(selectedIds);
  const keyword = search.trim().toLowerCase();

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Tìm nhanh{' '}
          {scopeType === 'COURSE' ? 'khóa học' : scopeType === 'INSTRUCTOR' ? 'giảng viên' : 'danh mục'}
        </span>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              scopeType === 'COURSE'
                ? 'Gõ tên khóa học để tìm...'
                : scopeType === 'INSTRUCTOR'
                  ? 'Gõ tên hoặc email giảng viên...'
                  : 'Gõ tên danh mục để tìm...'
            }
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-[14px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </label>

      <div className="rounded-2xl border border-slate-200 bg-white p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
            ))}
          </div>
        ) : keyword.length < 2 ? (
          <div className="px-4 py-8 text-center text-[13px] text-slate-500">{emptyHint}</div>
        ) : visibleOptions.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-slate-500">
            Không tìm thấy{' '}
            {scopeType === 'COURSE' ? 'khóa học' : scopeType === 'INSTRUCTOR' ? 'giảng viên' : 'danh mục'} phù hợp.
          </div>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto p-1">
            {visibleOptions.map((option) => {
              const selected = selectedSet.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onToggleTarget(option)}
                  className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50/60 hover:border-emerald-200 hover:bg-emerald-50/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-slate-800">{option.title}</div>
                    <div className="mt-1 text-[12px] leading-5 text-slate-500">{option.subtitle}</div>
                    {option.meta && <div className="mt-1 text-[11px] leading-5 text-slate-400">{option.meta}</div>}
                  </div>
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Đã chọn {selectedIds.length} mục
          </p>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => selectedOptions.forEach((option) => onToggleTarget(option))}
              className="text-[12px] font-semibold text-slate-500 transition hover:text-rose-600"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>

        {selectedOptions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggleTarget(option)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                {option.title}
                <span className="text-emerald-500">×</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[13px] leading-5 text-slate-500">
            Chưa chọn gì. Hãy chọn một hoặc nhiều mục ở danh sách phía trên.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string | null | undefined;
  accent: 'slate' | 'emerald' | 'amber' | 'blue' | 'violet';
}) {
  const safeValue = Number(value ?? 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        {safeValue.toLocaleString('vi-VN')}
      </div>
      <div className="mt-3 h-1.5 w-20 rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full ${
            accent === 'emerald'
              ? 'bg-emerald-500'
              : accent === 'amber'
                ? 'bg-amber-500'
                : accent === 'blue'
                  ? 'bg-blue-500'
                  : accent === 'violet'
                    ? 'bg-violet-500'
                    : 'bg-slate-500'
          }`}
        />
      </div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Hoạt động' : 'Tạm tắt'}
    </span>
  );
}

export default function AdminCoupons() {
  const {
    coupons,
    summary,
    loading,
    error,
    filter,
    setFilter,
    createCoupon,
    editCoupon,
    deleteCoupon,
    toggleStatus,
  } = useAdminCoupons();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCouponItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  // ── Edit state ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<AdminCouponItem | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editForm, setEditForm] = useState<CouponForm>(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  // ── Toast state ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [courseSuggestions, setCourseSuggestions] = useState<ScopeTargetOption[]>([]);
  const [selectedScopeOptions, setSelectedScopeOptions] = useState<Record<AdminCouponScopeType, ScopeTargetOption[]>>({
    ALL: [],
    COURSE: [],
    CATEGORY: [],
    INSTRUCTOR: [],
  });
  const [instructorOptions, setInstructorOptions] = useState<AdminUserRecord[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<AdminCategoryItem[]>([]);
  const [scopeSearch, setScopeSearch] = useState('');
  const [scopeOptionsLoading, setScopeOptionsLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(coupons.length / PAGE_SIZE));
  const indexOfLast = currentPage * PAGE_SIZE;
  const indexOfFirst = indexOfLast - PAGE_SIZE;
  const visibleCoupons = useMemo(
    () => coupons.slice(indexOfFirst, indexOfLast),
    [coupons, indexOfFirst, indexOfLast],
  );

  useEffect(() => setCurrentPage(1), [filter]);

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();

    const loadScopeOptions = async () => {
      try {
        const [instructorsResponse, categoriesResponse] = await Promise.all([
          axiosClient.get<{ data?: AdminUserRecord[] }>('/admin/users', {
            params: { role: 'INSTRUCTOR' },
            signal: controller.signal,
          } as any),
          axiosClient.get<{ data?: AdminCategoryItem[] }>('/admin/categories', {
            signal: controller.signal,
          } as any),
        ]);

        setInstructorOptions(Array.isArray(instructorsResponse?.data) ? instructorsResponse.data : []);
        setCategoryOptions(Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []);
      } catch (error: any) {
        if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
          setInstructorOptions([]);
          setCategoryOptions([]);
        }
      }
    };

    void loadScopeOptions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setScopeSearch('');
  }, [form.scopeType]);

  useEffect(() => {
    if (form.scopeType !== 'COURSE') {
      setScopeOptionsLoading(false);
      return;
    }

    const keyword = scopeSearch.trim();
    if (keyword.length < 2) {
      setCourseSuggestions([]);
      setScopeOptionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setScopeOptionsLoading(true);
      void (async () => {
        try {
          const response = await axiosClient.get<{ data?: AdminManagedCourse[] }>('/admin/courses', {
            params: { status: 'PUBLISHED', search: keyword },
            signal: controller.signal,
          } as any);
          const mapped = (Array.isArray(response?.data) ? response.data : []).map((course) => ({
            id: course.id,
            title: course.tenKhoaHoc ?? `Kh�a học #${course.id}`,
            subtitle: course.instructorName ?? 'Chưa c� t�n giảng vi�n',
            meta: `${course.categoryName ?? 'Chưa c� danh mục'} � ${formatCurrency(Number(course.giaBan ?? 0))}`,
          }));
          setCourseSuggestions(mapped);
        } catch (error: any) {
          if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
            setCourseSuggestions([]);
          }
        } finally {
          setScopeOptionsLoading(false);
        }
      })();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [form.scopeType, scopeSearch]);

  const selectedScopeTargetIds = useMemo(() => parseTargetIds(form.scopeTargetIds), [form.scopeTargetIds]);
  const selectedScopeOptionsForCurrentType = selectedScopeOptions[form.scopeType] ?? [];

  const visibleScopeOptions = useMemo<ScopeTargetOption[]>(() => {
    const keyword = scopeSearch.trim().toLowerCase();

    if (form.scopeType === 'COURSE') {
      return courseSuggestions;
    }

    const baseOptions =
      form.scopeType === 'INSTRUCTOR'
        ? instructorOptions.map((instructor) => ({
            id: instructor.id,
            title: instructor.fullName ?? `Giảng vi�n #${instructor.id}`,
            subtitle: instructor.email ?? 'Chưa c� email',
            meta: `${Number(instructor.purchaseCount ?? 0)} lượt mua � ${Number(instructor.activeEnrollments ?? 0)} kh�a đang học`,
          }))
        : form.scopeType === 'CATEGORY'
          ? categoryOptions.map((category) => ({
              id: category.maDM,
              title: category.tenDM ?? `Danh mục #${category.maDM}`,
              subtitle: category.moTa ?? 'Chưa c� m� tả',
              meta: 'Danh mục kh�a học',
            }))
          : [];

    if (!keyword) return baseOptions;

    return baseOptions.filter((option) => {
      const title = option.title.toLowerCase();
      const subtitle = option.subtitle.toLowerCase();
      const meta = (option.meta ?? '').toLowerCase();
      return title.includes(keyword) || subtitle.includes(keyword) || meta.includes(keyword);
    });
  }, [categoryOptions, courseSuggestions, form.scopeType, instructorOptions, scopeSearch]);

  const toggleScopeTarget = (option: ScopeTargetOption) => {
    setSelectedScopeOptions((current) => {
      const currentItems = current[form.scopeType] ?? [];
      const exists = currentItems.some((item) => item.id === option.id);
      const nextItems = exists
        ? currentItems.filter((item) => item.id !== option.id)
        : [...currentItems, option];

      setForm((formCurrent) => ({
        ...formCurrent,
        scopeTargetIds: nextItems.map((item) => item.id).join(', '),
      }));

      return {
        ...current,
        [form.scopeType]: nextItems,
      };
    });
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setFormError(null);
    setScopeSearch('');
    setCourseSuggestions([]);
    setSelectedScopeOptions({
      ALL: [],
      COURSE: [],
      CATEGORY: [],
      INSTRUCTOR: [],
    });
    setFormOpen(true);
  };

  const openEditForm = (coupon: AdminCouponItem) => {
    // Pre-fill form from existing coupon data
    const preFilledForm: CouponForm = {
      maCode: coupon.maCode,
      giaTriGiam: Number(coupon.giaTriGiam),
      loaiGiam: coupon.loaiGiam,
      soLuongGioiHan: coupon.soLuongGioiHan ? String(coupon.soLuongGioiHan) : '',
      ngayBatDau: coupon.ngayBatDau
        ? new Date(coupon.ngayBatDau).toISOString().split('T')[0]
        : '',
      ngayKetThuc: coupon.ngayKetThuc
        ? new Date(coupon.ngayKetThuc).toISOString().split('T')[0]
        : '',
      ghiChu: coupon.ghiChu ?? '',
      trangThai: coupon.trangThai,
      scopeType: coupon.maKH ? 'COURSE' : 'ALL',
      scopeTargetIds: coupon.maKH ? String(coupon.maKH) : '',
      rules: [],
    };
    setEditForm(preFilledForm);
    setEditTarget(coupon);
    setEditFormError(null);
    setScopeSearch('');
    setCourseSuggestions([]);
    setSelectedScopeOptions({
      ALL: [],
      COURSE: coupon.maKH && coupon.tenKhoaHoc
        ? [{ id: coupon.maKH, title: coupon.tenKhoaHoc, subtitle: '' }]
        : [],
      CATEGORY: [],
      INSTRUCTOR: [],
    });
    setEditFormOpen(true);
  };

  const closeEditForm = () => {
    setEditFormOpen(false);
    setEditFormError(null);
    setEditTarget(null);
    setScopeSearch('');
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
    setScopeSearch('');
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;

    const isLocked = editTarget.soLuongDaDung > 0;

    // ── Validate Nhóm 1 ──────────────────────────────────────────────────────
    if (editForm.ngayKetThuc) {
      const endDate = new Date(editForm.ngayKetThuc);
      if (endDate <= new Date()) {
        setEditFormError('Ngày kết thúc phải lớn hơn thời điểm hiện tại');
        return;
      }
    }
    if (editForm.soLuongGioiHan) {
      const newLimit = Number(editForm.soLuongGioiHan);
      if (newLimit < editTarget.soLuongDaDung) {
        setEditFormError(
          `Giới hạn lượt dùng mới (${newLimit}) không được nhỏ hơn số lượt đã dùng (${editTarget.soLuongDaDung})`,
        );
        return;
      }
    }

    // ── Validate Nhóm 2 (chỉ khi không bị khóa) ──────────────────────────────
    if (!isLocked) {
      if (!editForm.maCode.trim()) {
        setEditFormError('Mã giảm giá không được để trống');
        return;
      }
      const scopeTargetIds = editForm.scopeType === 'ALL' ? null : selectedScopeTargetIds;
      if (editForm.scopeType !== 'ALL' && (!scopeTargetIds || scopeTargetIds.length === 0)) {
        setEditFormError('Vui lòng chọn ít nhất một mục cho phạm vi đã chọn');
        return;
      }
    }

    setEditSubmitting(true);
    setEditFormError(null);
    try {
      const isLocked = editTarget.soLuongDaDung > 0;
      const payload: UpdateAdminCouponPayload = {
        // Nhóm 1: luôn gửi
        ghiChu: editForm.ghiChu.trim() || null,
        ngayKetThuc: editForm.ngayKetThuc || null,
        soLuongGioiHan: editForm.soLuongGioiHan ? Number(editForm.soLuongGioiHan) : null,
        trangThai: editForm.trangThai,
        // Nhóm 2: chỉ gửi khi không bị khóa
        ...(!isLocked && {
          maCode: editForm.maCode.trim().toUpperCase(),
          loaiGiam: editForm.loaiGiam,
          giaTriGiam: editForm.giaTriGiam,
          scopeType: editForm.scopeType,
          scopeTargetIds:
            editForm.scopeType === 'ALL' ? null : selectedScopeTargetIds,
          rules: [],
        }),
      };
      await editCoupon(editTarget.maCoupon, payload);
      closeEditForm();
      setToast({ message: `Cập nhật mã "${editTarget.maCode}" thành công!`, type: 'success' });
    } catch (err: any) {
      setEditFormError(err?.response?.data?.message ?? 'Lỗi cập nhật mã khuyến mãi');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.maCode.trim()) {
      setFormError('Mã giảm giá không được để trống');
      return;
    }
    const scopeTargetIds = form.scopeType === 'ALL' ? null : selectedScopeTargetIds;
    if (form.scopeType !== 'ALL' && (!scopeTargetIds || scopeTargetIds.length === 0)) {
      setFormError('Vui lòng chọn ít nhất một mục cho phạm vi đã chọn');
      return;
    }

    const rulesPayload: NonNullable<CreateAdminCouponPayload['rules']> = [];
    for (const rule of form.rules) {
      const value = rule.giaTriDieuKien.trim();
      const numericValue = value ? Number(value) : null;
      if (requiresRuleValue(rule.loaiDieuKien) && numericValue === null) {
        setFormError(`Điều kiện ${rule.loaiDieuKien} cần nhập giá trị`);
        return;
      }
      if (numericValue !== null && (!Number.isFinite(numericValue) || numericValue < 0)) {
        setFormError('Giá trị điều kiện không hợp lệ');
        return;
      }
      rulesPayload.push({
        loaiDieuKien: rule.loaiDieuKien,
        giaTriDieuKien: numericValue,
        moTa: null,
      });
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload: CreateAdminCouponPayload = {
        maCode: form.maCode.trim().toUpperCase(),
        maKM: null,
        loaiKM: 'STANDARD',
        giaTriGiam: form.giaTriGiam,
        loaiGiam: form.loaiGiam,
        trangThai: form.trangThai,
        ngayBatDau: form.ngayBatDau || null,
        ngayKetThuc: form.ngayKetThuc || null,
        soLuongGioiHan: form.soLuongGioiHan ? Number(form.soLuongGioiHan) : null,
        ghiChu: form.ghiChu.trim() || null,
        scopeType: form.scopeType,
        scopeTargetIds,
        rules: rulesPayload,
      };
      await createCoupon(payload);
      closeForm();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Lỗi tạo mã khuyến mãi');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCoupon(deleteTarget.maCoupon);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Lỗi xóa mã khuyến mãi');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (coupon: AdminCouponItem) => {
    setTogglingId(coupon.maCoupon);
    try {
      await toggleStatus(coupon);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Mã giảm giá
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Quản lý khuyến mãi</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tạo, bật tắt và theo dõi mã giảm giá toàn sàn trong một giao diện gọn và rõ.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:translate-y-[1px]"
              id="btn-create-coupon"
            >
              Tạo mã khuyến mãi
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryCard label="Tổng mã" value={summary.total} accent="slate" />
            <SummaryCard label="Đang hoạt động" value={summary.activeCount} accent="emerald" />
            <SummaryCard label="Cross-sell active" value={summary.crossSellActive} accent="amber" />
            <SummaryCard label="Lần đầu active" value={summary.firstTimeActive} accent="blue" />
            <SummaryCard label="Tổng lượt dùng" value={summary.totalUsed} accent="violet" />
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Tìm kiếm
              </span>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={filter.search ?? ''}
                  onChange={(e) => setFilter((prev: QueryCouponsFilter) => ({ ...prev, search: e.target.value }))}
                  placeholder="Tìm theo mã giảm giá..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-[14px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  id="search-coupon-input"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Loại mã
              </span>
              <select
                value={filter.loaiKM ?? ''}
                onChange={(e) =>
                  setFilter((prev: QueryCouponsFilter) => ({ ...prev, loaiKM: e.target.value as LoaiKM | '' }))
                }
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                id="filter-loaikm"
              >
                <option value="">Tất cả</option>
                {LOAI_KM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Trạng thái
              </span>
              <select
                value={filter.trangThai ?? ''}
                onChange={(e) =>
                  setFilter((prev: QueryCouponsFilter) => ({
                    ...prev,
                    trangThai: e.target.value as 'ACTIVE' | 'INACTIVE' | '',
                  }))
                }
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                id="filter-trangthai"
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm tắt</option>
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold text-slate-800">Danh sách mã khuyến mãi</h2>
              <p className="mt-1 text-[13px] text-slate-500">{coupons.length} mã trong bộ lọc hiện tại</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                type="button"
                onClick={() => setFilter({ ...filter })}
                className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Thử lại
              </button>
            </div>
          ) : coupons.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <span className="text-lg font-bold">%</span>
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-slate-800">
                {filter.search ? 'Không tìm thấy mã khuyến mãi' : 'Chưa có mã nào'}
              </h3>
              <p className="mt-2 text-[14px] text-slate-500">
                {filter.search ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Tạo mã khuyến mãi đầu tiên để bắt đầu áp dụng ưu đãi.'}
              </p>
              {!filter.search && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-emerald-700"
                >
                  Tạo mã đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-left">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="w-[16%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Mã Code
                      </th>
                      <th className="w-[22%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Loại mã
                      </th>
                      <th className="w-[14%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">
                        Giảm giá
                      </th>
                      <th className="w-[14%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Hết hạn
                      </th>
                      <th className="w-[10%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">
                        Lượt dùng
                      </th>
                      <th className="w-[10%] px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">
                        Trạng thái
                      </th>
                      <th className="w-[8%] px-5 py-4 text-right text-[12px] font-bold uppercase tracking-wider text-slate-500">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleCoupons.map((coupon) => {
                      const loaiInfo = LOAI_KM_OPTIONS.find((o) => o.value === coupon.loaiKM) ?? LOAI_KM_OPTIONS[3];
                      const loaiClass =
                        coupon.loaiKM === 'FIRST_TIME'
                          ? 'bg-blue-50 text-blue-700'
                          : coupon.loaiKM === 'CROSS_SELL'
                            ? 'bg-amber-50 text-amber-700'
                            : coupon.loaiKM === 'HOLIDAY'
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-slate-100 text-slate-700';
                      const isToggling = togglingId === coupon.maCoupon;

                      return (
                        <tr key={coupon.maCoupon} className="transition hover:bg-slate-50/60">
                          
                          <td className="px-5 py-4">
                            <div className="font-mono text-[14px] font-bold text-slate-800">{coupon.maCode}</div>
                            {coupon.maKM && <div className="text-[11px] text-slate-400">{coupon.maKM}</div>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${loaiClass}`}>
                              {loaiInfo.label}
                            </span>
                            {coupon.ghiChu && <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">{coupon.ghiChu}</p>}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[13px] font-bold text-emerald-700">
                                {coupon.loaiGiam === 'PERCENT' ? <Percent size={11} /> : null}
                                {formatDiscountValue(coupon.loaiGiam, Number(coupon.giaTriGiam))}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
                              <Calendar size={13} className="text-slate-400" />
                              {formatDate(coupon.ngayKetThuc)}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-[13px] font-semibold text-slate-700">
                              {coupon.soLuongDaDung}
                              {coupon.soLuongGioiHan ? ` / ${coupon.soLuongGioiHan}` : ''}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => void handleToggle(coupon)}
                              disabled={isToggling}
                              className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition disabled:opacity-50"
                              id={`toggle-status-${coupon.maCoupon}`}
                            >
                              {isToggling ? (
                                <Loader2 size={16} className="animate-spin text-slate-400" />
                              ) : coupon.trangThai === 'ACTIVE' ? (
                                <>
                                  <ToggleRight size={20} className="text-emerald-500" />
                                  <span className="text-emerald-600">Vô hiệu</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={20} className="text-slate-400" />
                                  <span className="text-slate-500">Kích hoạt</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditForm(coupon)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                title="Sửa mã"
                                id={`edit-coupon-${coupon.maCoupon}`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(coupon)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                title="Xóa mã"
                                id={`delete-coupon-${coupon.maCoupon}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 px-5 pb-5">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={coupons.length}
                  indexOfFirst={indexOfFirst}
                  indexOfLast={indexOfLast}
                  variant="numbers"
                />
              </div>
            </div>
          )}
        </section>

                {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => !submitting && closeForm()}
            />

            <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div className="max-w-2xl">
                  <h3 className="mt-2 text-[22px] font-black tracking-tight text-slate-900">
                    Tạo mã giảm giá
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-full px-2 py-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="max-h-[calc(90vh-84px)] overflow-y-auto">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                  <div className="space-y-5 border-b border-slate-100 bg-slate-50/60 p-5 lg:border-b-0 lg:border-r">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Cấu hình chính
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-slate-500">
                        Mã, loại giảm và thời gian chạy của coupon.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Mã giảm giá <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={form.maCode}
                          onChange={(e) => setForm((f) => ({ ...f, maCode: e.target.value.toUpperCase() }))}
                          placeholder="VD: NEW25, HOT20"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-[14px] font-bold uppercase text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          id="input-macode"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Kiểu giảm <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.loaiGiam}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              loaiGiam: e.target.value as 'PERCENT' | 'AMOUNT',
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="PERCENT">Giảm theo %</option>
                          <option value="AMOUNT">Giảm tiền trực tiếp</option>
                        </select>
                        <div className="mt-3">
                          <label htmlFor="input-giatrigiam" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {form.loaiGiam === 'PERCENT' ? 'Mức giảm (%)' : 'Số tiền giảm (đ)'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="input-giatrigiam"
                            type="number"
                            min={1}
                            value={form.giaTriGiam}
                            onChange={(e) => setForm((f) => ({ ...f, giaTriGiam: Number(e.target.value || 0) }))}
                            placeholder={form.loaiGiam === 'PERCENT' ? 'VD: 20' : 'VD: 50000'}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Ngày bắt đầu
                          </label>
                          <input
                            type="date"
                            value={form.ngayBatDau}
                            onChange={(e) => setForm((f) => ({ ...f, ngayBatDau: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Ngày kết thúc
                          </label>
                          <input
                            type="date"
                            value={form.ngayKetThuc}
                            onChange={(e) => setForm((f) => ({ ...f, ngayKetThuc: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Giới hạn lượt dùng
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={form.soLuongGioiHan}
                          onChange={(e) => setForm((f) => ({ ...f, soLuongGioiHan: e.target.value }))}
                          placeholder="Vô hạn nếu để trống"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Phạm vi và điều kiện
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-slate-500">
                        Chọn nơi áp dụng và thêm các điều kiện ràng buộc nếu cần.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Loại phạm vi
                          </label>
                          <select
                            value={form.scopeType}
                            onChange={(e) =>
                              setForm((f) => {
                                const nextScopeType = e.target.value as AdminCouponScopeType;
                                setSelectedScopeOptions({
                                  ALL: [],
                                  COURSE: [],
                                  CATEGORY: [],
                                  INSTRUCTOR: [],
                                });
                                setCourseSuggestions([]);
                                setScopeSearch('');
                                return {
                                  ...f,
                                  scopeType: nextScopeType,
                                  scopeTargetIds: '',
                                };
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          >
                            {SCOPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          {form.scopeType === 'ALL' ? (
                            <div>
                                
                            </div>
                          ) : (
                            <ScopeTargetPicker
                              scopeType={form.scopeType}
                              loading={scopeOptionsLoading}
                              search={scopeSearch}
                              onSearchChange={setScopeSearch}
                              visibleOptions={visibleScopeOptions}
                              selectedOptions={selectedScopeOptionsForCurrentType}
                              selectedIds={selectedScopeTargetIds}
                              onToggleTarget={toggleScopeTarget}
                              emptyHint={
                                form.scopeType === 'COURSE'
                                  ? 'Nhập tên khóa học'
                                  : 'Nhập từ khóa tìm kiếm'
                              }
                            />
                          )}
                          {/* <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                            {SCOPE_OPTIONS.find((opt) => opt.value === form.scopeType)}
                          </p> */}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Ghi chú / mô tả
                      </label>
                      <textarea
                        value={form.ghiChu}
                        onChange={(e) => setForm((f) => ({ ...f, ghiChu: e.target.value }))}
                        rows={3}
                        placeholder="Mô tả ngắn về điều kiện sử dụng mã..."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[14px] font-semibold text-slate-800">Điều kiện áp dụng</p>
                          <p className="mt-1 text-[12px] leading-5 text-slate-500">
                            Thêm điều kiện nếu coupon cần ràng buộc theo hành vi mua hàng.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              rules: [
                                ...f.rules,
                                {
                                  loaiDieuKien: 'FIRST_PURCHASE',
                                  giaTriDieuKien: '',
                                },
                              ],
                            }))
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Plus size={16} />
                          Thêm điều kiện
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {form.rules.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-[13px] text-slate-500">
                            Chưa có điều kiện nào. Coupon sẽ chỉ dựa trên phạm vi đã chọn.
                          </div>
                        ) : (
                          form.rules.map((rule, index) => {
                            const ruleInfo =
                              RULE_OPTIONS.find((opt) => opt.value === rule.loaiDieuKien) ?? RULE_OPTIONS[0];
                            const ruleNeedsValue = requiresRuleValue(rule.loaiDieuKien);
                            const rulePlaceholder =
                              rule.loaiDieuKien === 'MIN_ORDER_VALUE'
                                ? 'Tối thiểu bao nhiêu tiền'
                                : rule.loaiDieuKien === 'MIN_COURSE_COUNT' || rule.loaiDieuKien === 'COMBO_ONLY'
                                  ? 'Tối thiểu bao nhiêu item'
                                  : 'Số giờ';

                            return (
                              <div
                                key={`${rule.loaiDieuKien}-${index}`}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                              >
                                <div className="mb-4 flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                      Điều kiện {index + 1}
                                    </p>
                                    <p className="mt-1 text-[14px] font-semibold text-slate-800">
                                      {ruleInfo.label}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((f) => ({
                                        ...f,
                                        rules: f.rules.filter((_, currentIndex) => currentIndex !== index),
                                      }))
                                    }
                                    className="rounded-full border border-slate-200 px-3 py-1 text-[13px] font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  >
                                    Xóa
                                  </button>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                                  <div>
                                    <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                      Loại điều kiện
                                    </label>
                                    <select
                                      value={rule.loaiDieuKien}
                                      onChange={(e) =>
                                        setForm((f) => ({
                                          ...f,
                                          rules: f.rules.map((item, currentIndex) =>
                                            currentIndex === index
                                              ? {
                                                  ...item,
                                                  loaiDieuKien: e.target.value as AdminCouponRuleType,
                                                  giaTriDieuKien: requiresRuleValue(
                                                    e.target.value as AdminCouponRuleType,
                                                  )
                                                    ? item.giaTriDieuKien
                                                    : '',
                                                }
                                              : item,
                                          ),
                                        }))
                                      }
                                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    >
                                      {RULE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                      Giá trị
                                    </label>
                                    {ruleNeedsValue ? (
                                      <input
                                        type="number"
                                        min={0}
                                        value={rule.giaTriDieuKien}
                                        onChange={(e) =>
                                          setForm((f) => ({
                                            ...f,
                                            rules: f.rules.map((item, currentIndex) =>
                                              currentIndex === index
                                                ? { ...item, giaTriDieuKien: e.target.value }
                                                : item,
                                            ),
                                          }))
                                        }
                                        placeholder={rulePlaceholder}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                      />
                                    ) : (
                                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-500">
                                        Không bắt buộc
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="border-t border-red-100 bg-red-50/70 px-6 py-3 text-[14px] text-red-600">
                    {formError}
                  </div>
                )}

                <div className="border-t border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={submitting}
                      className="rounded-2xl px-5 py-2.5 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !form.maCode.trim()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        'Tạo khuyến mãi'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}{deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <h3 className="text-[20px] font-black tracking-tight text-slate-900">Xóa mã khuyến mãi</h3>
              <p className="mt-2 text-[14px] leading-6 text-slate-500">
                Bạn có chắc muốn xóa mã{' '}
                <span className="font-mono font-bold text-slate-800">"{deleteTarget.maCode}"</span>?
                {deleteTarget.soLuongDaDung > 0 && (
                  <span className="mt-2 block rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    Mã này đã được dùng {deleteTarget.soLuongDaDung} lần. Không thể xóa.
                  </span>
                )}
              </p>

              <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => !deleting && setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={deleting || deleteTarget.soLuongDaDung > 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  id="confirm-delete-coupon"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa mã'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ EDIT COUPON MODAL ══════════════ */}
        {editFormOpen && editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => !editSubmitting && closeEditForm()}
            />

            <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                    Chỉnh sửa mã giảm giá
                  </p>
                  <h3 className="mt-1.5 text-[22px] font-black tracking-tight text-slate-900">
                    <span className="font-mono">{editTarget.maCode}</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeEditForm}
                  disabled={editSubmitting}
                  className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Đóng"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Warning banner when coupon has been used */}
              {editTarget.soLuongDaDung > 0 && (
                <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50/80 px-6 py-4">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-[13px] font-semibold text-amber-800">
                      Mã này đã được sử dụng {editTarget.soLuongDaDung} lần
                    </p>
                    <p className="mt-0.5 text-[12px] leading-5 text-amber-700">
                      Bạn không thể thay đổi <strong>Mã code</strong>, <strong>Kiểu giảm</strong>,{' '}
                      <strong>Giá trị giảm</strong> và <strong>Phạm vi áp dụng</strong> để đảm bảo lịch sử đối soát.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => void handleEditSubmit(e)} className="max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                  {/* ── Cột trái: Cấu hình chính ── */}
                  <div className="space-y-5 border-b border-slate-100 bg-slate-50/60 p-5 lg:border-b-0 lg:border-r">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Cấu hình chính
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-slate-500">
                        {editTarget.soLuongDaDung > 0
                          ? 'Mã code, kiểu và giá trị giảm bị khóa do đã có lượt dùng.'
                          : 'Mã, loại giảm và thời gian chạy của coupon.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Mã giảm giá */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Mã giảm giá{' '}
                          {editTarget.soLuongDaDung === 0 && <span className="text-red-500">*</span>}
                          {editTarget.soLuongDaDung > 0 && (
                            <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                              KHÓA
                            </span>
                          )}
                        </label>
                        <input
                          value={editForm.maCode}
                          readOnly={editTarget.soLuongDaDung > 0}
                          onChange={(e) =>
                            editTarget.soLuongDaDung === 0 &&
                            setEditForm((f) => ({ ...f, maCode: e.target.value.toUpperCase() }))
                          }
                          className={`w-full rounded-2xl border px-4 py-2.5 font-mono text-[14px] font-bold uppercase text-slate-800 outline-none transition ${
                            editTarget.soLuongDaDung > 0
                              ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
                              : 'border-slate-200 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                          id="edit-input-macode"
                        />
                      </div>

                      {/* Kiểu giảm */}
                      <div>
                        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Kiểu giảm{' '}
                          {editTarget.soLuongDaDung > 0 && (
                            <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                              KHÓA
                            </span>
                          )}
                        </label>
                        <select
                          value={editForm.loaiGiam}
                          disabled={editTarget.soLuongDaDung > 0}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              loaiGiam: e.target.value as 'PERCENT' | 'AMOUNT',
                            }))
                          }
                          className={`w-full rounded-2xl border px-4 py-2.5 text-[14px] text-slate-700 outline-none transition ${
                            editTarget.soLuongDaDung > 0
                              ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
                              : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                          }`}
                        >
                          <option value="PERCENT">Giảm theo %</option>
                          <option value="AMOUNT">Giảm tiền trực tiếp</option>
                        </select>

                        {/* Giá trị giảm */}
                        <div className="mt-3">
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {editForm.loaiGiam === 'PERCENT' ? 'Mức giảm (%)' : 'Số tiền giảm (đ)'}
                            {editTarget.soLuongDaDung > 0 && (
                              <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                KHÓA
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={editForm.giaTriGiam}
                            disabled={editTarget.soLuongDaDung > 0}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, giaTriGiam: Number(e.target.value || 0) }))
                            }
                            className={`w-full rounded-2xl border px-4 py-2.5 text-[14px] text-slate-700 outline-none transition ${
                              editTarget.soLuongDaDung > 0
                                ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
                                : 'border-slate-200 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Ngày bắt đầu + Kết thúc */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Ngày bắt đầu
                          </label>
                          <input
                            type="date"
                            value={editForm.ngayBatDau}
                            readOnly
                            className="w-full cursor-not-allowed rounded-2xl border border-slate-100 bg-slate-100 px-4 py-2.5 text-[14px] text-slate-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Ngày kết thúc
                          </label>
                          <input
                            type="date"
                            value={editForm.ngayKetThuc}
                            onChange={(e) => setEditForm((f) => ({ ...f, ngayKetThuc: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Giới hạn lượt dùng */}
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Giới hạn lượt dùng
                          {editTarget.soLuongDaDung > 0 && (
                            <span className="ml-1.5 text-slate-400">
                              (min: {editTarget.soLuongDaDung})
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min={editTarget.soLuongDaDung > 0 ? editTarget.soLuongDaDung : 1}
                          value={editForm.soLuongGioiHan}
                          onChange={(e) => setEditForm((f) => ({ ...f, soLuongGioiHan: e.target.value }))}
                          placeholder="Vô hạn nếu để trống"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Trạng thái */}
                      <div>
                        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Trạng thái
                        </label>
                        <div className="flex gap-3">
                          {(['ACTIVE', 'INACTIVE'] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setEditForm((f) => ({ ...f, trangThai: status }))}
                              className={`flex-1 rounded-2xl border py-2.5 text-[13px] font-semibold transition ${
                                editForm.trangThai === status
                                  ? status === 'ACTIVE'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-300 bg-slate-100 text-slate-600'
                                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              {status === 'ACTIVE' ? 'Kích hoạt' : 'Vô hiệu'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Cột phải: Phạm vi + Ghi chú ── */}
                  <div className="space-y-5 p-5">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Phạm vi và mô tả
                      </p>
                      <p className="mt-1 text-[13px] leading-5 text-slate-500">
                        {editTarget.soLuongDaDung > 0
                          ? 'Phạm vi áp dụng bị khóa do đã có lượt dùng.'
                          : 'Chọn nơi áp dụng mã giảm giá.'}
                      </p>
                    </div>

                    {/* Phạm vi áp dụng */}
                    <div className={`rounded-2xl border p-4 ${editTarget.soLuongDaDung > 0 ? 'border-slate-100 bg-slate-50/50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Loại phạm vi
                            {editTarget.soLuongDaDung > 0 && (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                KHÓA
                              </span>
                            )}
                          </label>
                          <select
                            value={editForm.scopeType}
                            disabled={editTarget.soLuongDaDung > 0}
                            onChange={(e) =>
                              setEditForm((f) => {
                                const nextScopeType = e.target.value as AdminCouponScopeType;
                                setSelectedScopeOptions({
                                  ALL: [],
                                  COURSE: [],
                                  CATEGORY: [],
                                  INSTRUCTOR: [],
                                });
                                setCourseSuggestions([]);
                                setScopeSearch('');
                                return {
                                  ...f,
                                  scopeType: nextScopeType,
                                  scopeTargetIds: '',
                                };
                              })
                            }
                            className={`w-full rounded-2xl border px-4 py-2.5 text-[14px] text-slate-700 outline-none transition ${
                              editTarget.soLuongDaDung > 0
                                ? 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
                                : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                          >
                            {SCOPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          {editTarget.soLuongDaDung > 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-100/60 px-4 py-8 text-center text-[13px] text-slate-400">
                              Phạm vi bị khóa
                            </div>
                          ) : editForm.scopeType === 'ALL' ? (
                            <div />
                          ) : (
                            <ScopeTargetPicker
                              scopeType={editForm.scopeType}
                              loading={scopeOptionsLoading}
                              search={scopeSearch}
                              onSearchChange={setScopeSearch}
                              visibleOptions={visibleScopeOptions}
                              selectedOptions={selectedScopeOptionsForCurrentType}
                              selectedIds={selectedScopeTargetIds}
                              onToggleTarget={toggleScopeTarget}
                              emptyHint={
                                editForm.scopeType === 'COURSE'
                                  ? 'Nhập tên khóa học'
                                  : 'Nhập từ khóa tìm kiếm'
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ghi chú */}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Ghi chú / mô tả
                      </label>
                      <textarea
                        value={editForm.ghiChu}
                        onChange={(e) => setEditForm((f) => ({ ...f, ghiChu: e.target.value }))}
                        rows={4}
                        placeholder="Mô tả ngắn về điều kiện sử dụng mã..."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Info về lượt dùng hiện tại */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-slate-500">Lượt đã dùng</span>
                        <span className="font-bold text-slate-800">
                          {editTarget.soLuongDaDung}
                          {editTarget.soLuongGioiHan ? ` / ${editTarget.soLuongGioiHan}` : ' / ∞'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {editFormError && (
                  <div className="border-t border-red-100 bg-red-50/70 px-6 py-3 text-[14px] text-red-600">
                    {editFormError}
                  </div>
                )}

                {/* Footer actions */}
                <div className="border-t border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeEditForm}
                      disabled={editSubmitting}
                      className="rounded-2xl px-5 py-2.5 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                      id="submit-edit-coupon"
                    >
                      {editSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════ TOAST NOTIFICATION ══════════════ */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-xl transition-all duration-300 ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle size={20} className="shrink-0 text-red-500" />
            )}
            <p className="text-[14px] font-semibold">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 shrink-0 rounded-full p-1 opacity-60 transition hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
