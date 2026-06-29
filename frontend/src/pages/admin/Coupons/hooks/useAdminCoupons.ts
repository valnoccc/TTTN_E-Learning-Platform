import { useCallback, useEffect, useState } from 'react';
import axiosClient from '../../../../api/axios';

export type AdminCouponStatus = 'ACTIVE' | 'INACTIVE' | 'ALL';
export type AdminCouponDiscountType = 'PERCENT' | 'AMOUNT';
export type AdminCouponScopeType = 'ALL' | 'COURSE' | 'CATEGORY' | 'INSTRUCTOR';
export type AdminCouponRuleType =
  | 'NEW_USER_24H'
  | 'FIRST_PURCHASE'
  | 'COMBO_ONLY'
  | 'MIN_ORDER_VALUE'
  | 'MIN_COURSE_COUNT';
export type AdminCouponCampaignType =
  | 'FIRST_TIME'
  | 'CROSS_SELL'
  | 'HOLIDAY'
  | 'STANDARD';

export interface AdminCouponRuleForm {
  loaiDieuKien: AdminCouponRuleType;
  giaTriDieuKien: string;
  moTa: string;
}

export interface AdminCouponFormState {
  maCode: string;
  giaTriGiam: string;
  loaiGiam: AdminCouponDiscountType;
  trangThai: Exclude<AdminCouponStatus, 'ALL'>;
  ngayBatDau: string;
  ngayKetThuc: string;
  soLuongGioiHan: string;
  ghiChu: string;
  maKM: string;
  loaiKM: AdminCouponCampaignType;
  scopeType: AdminCouponScopeType;
  scopeTargetIds: string;
  rules: AdminCouponRuleForm[];
}

export interface AdminCouponScope {
  maPhamVi: number;
  maCoupon: number;
  loaiPhamVi: AdminCouponScopeType;
  maDoiTuong: number | null;
  tenDoiTuong: string | null;
}

export interface AdminCouponRule {
  maDieuKien: number;
  maCoupon: number;
  loaiDieuKien: AdminCouponRuleType;
  giaTriDieuKien: number | null;
  moTa: string | null;
}

export interface AdminCouponRecord {
  maCoupon: number;
  maCode: string;
  giaTriGiam: number;
  loaiGiam: AdminCouponDiscountType;
  trangThai: Exclude<AdminCouponStatus, 'ALL'>;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maKH: number | null;
  tenKhoaHoc: string | null;
  soLuongGioiHan: number | null;
  soLuongDaDung: number;
  ghiChu: string | null;
  maKM: string | null;
  loaiKM: AdminCouponCampaignType;
  rules: AdminCouponRule[];
  scopes: AdminCouponScope[];
}

export interface AdminCouponSummary {
  totalCouponCount: number;
  activeCount: number;
  totalUsageCount: number;
}

export interface AdminCouponScopeOption {
  id: number;
  label: string;
  description?: string;
}

export interface AdminCouponScopeOptions {
  courses: AdminCouponScopeOption[];
  categories: AdminCouponScopeOption[];
  instructors: AdminCouponScopeOption[];
}

const emptyForm = (): AdminCouponFormState => ({
  maCode: '',
  giaTriGiam: '',
  loaiGiam: 'PERCENT',
  trangThai: 'ACTIVE',
  ngayBatDau: '',
  ngayKetThuc: '',
  soLuongGioiHan: '',
  ghiChu: '',
  maKM: '',
  loaiKM: 'STANDARD',
  scopeType: 'ALL',
  scopeTargetIds: '',
  rules: [
    {
      loaiDieuKien: 'FIRST_PURCHASE',
      giaTriDieuKien: '',
      moTa: '',
    },
  ],
});

export function useAdminCoupons() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminCouponStatus>('ALL');
  const [summary, setSummary] = useState<AdminCouponSummary>({
    totalCouponCount: 0,
    activeCount: 0,
    totalUsageCount: 0,
  });
  const [coupons, setCoupons] = useState<AdminCouponRecord[]>([]);
  const [scopeOptions, setScopeOptions] = useState<AdminCouponScopeOptions>({
    courses: [],
    categories: [],
    instructors: [],
  });
  const [scopeOptionsLoading, setScopeOptionsLoading] = useState(false);
  const [scopeSearch, setScopeSearch] = useState('');
  const [form, setForm] = useState<AdminCouponFormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await axiosClient.get('/admin/coupons', {
        params: {
          search: search.trim() || undefined,
          status: status === 'ALL' ? undefined : status,
        },
      });

      const data = response?.data ?? response;
      setSummary(data.summary ?? { totalCouponCount: 0, activeCount: 0, totalUsageCount: 0 });
      setCoupons(data.items ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    const loadScopeOptions = async () => {
      try {
        setScopeOptionsLoading(true);
        const [coursesResponse, categoriesResponse, instructorsResponse]: any[] = await Promise.all([
          axiosClient.get('/admin/courses', {
            params: { status: 'ALL' },
          }),
          axiosClient.get('/admin/categories'),
          axiosClient.get('/public/instructors'),
        ]);

        const courses = Array.isArray(coursesResponse?.data)
          ? coursesResponse.data
          : [];
        const categories = Array.isArray(categoriesResponse?.data)
          ? categoriesResponse.data
          : [];
        const instructors = Array.isArray(instructorsResponse)
          ? instructorsResponse
          : Array.isArray(instructorsResponse?.data)
            ? instructorsResponse.data
            : [];

        setScopeOptions({
          courses: courses.map((course: any) => ({
            id: Number(course.id),
            label: course.tenKhoaHoc || `Khóa học #${course.id}`,
            description: [course.instructorName, course.categoryName, course.trangThai]
              .filter(Boolean)
              .join(' • '),
          })),
          categories: categories.map((category: any) => ({
            id: Number(category.maDM),
            label: category.tenDM || `Danh mục #${category.maDM}`,
            description: category.moTa || undefined,
          })),
          instructors: instructors.map((instructor: any) => ({
            id: Number(instructor.id),
            label: instructor.personName || `Giảng viên #${instructor.id}`,
            description: instructor.personTitle || undefined,
          })),
        });
      } catch {
        setScopeOptions({
          courses: [],
          categories: [],
          instructors: [],
        });
      } finally {
        setScopeOptionsLoading(false);
      }
    };

    void loadScopeOptions();
  }, []);

  const resetForm = () => {
    setScopeSearch('');
    setForm(emptyForm());
  };

  const updateRule = (
    index: number,
    patch: Partial<AdminCouponRuleForm>,
  ) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule,
      ),
    }));
  };

  const addRule = () => {
    setForm((current) => ({
      ...current,
      rules: [
        ...current.rules,
        {
          loaiDieuKien: 'MIN_ORDER_VALUE',
          giaTriDieuKien: '',
          moTa: '',
        },
      ],
    }));
  };

  const removeRule = (index: number) => {
    setForm((current) => ({
      ...current,
      rules: current.rules.length === 1
        ? current.rules
        : current.rules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  };

  const submitCoupon = async () => {
    const maCode = form.maCode.trim().toUpperCase();
    const giaTriGiam = Number(form.giaTriGiam);
    const soLuongGioiHan = form.soLuongGioiHan.trim()
      ? Number(form.soLuongGioiHan)
      : null;
    const scopeTargetIds = form.scopeTargetIds
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item > 0);

    const rules = form.rules
      .filter((rule) => rule.loaiDieuKien)
      .map((rule) => ({
        loaiDieuKien: rule.loaiDieuKien,
        giaTriDieuKien: rule.giaTriDieuKien.trim()
          ? Number(rule.giaTriDieuKien)
          : null,
        moTa: rule.moTa.trim() || null,
      }));

    if (!maCode) {
      setError('Vui lòng nhập mã giảm giá');
      return false;
    }

    if (!Number.isFinite(giaTriGiam) || giaTriGiam <= 0) {
      setError('Giá trị giảm phải lớn hơn 0');
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        maCode,
        giaTriGiam,
        loaiGiam: form.loaiGiam,
        trangThai: form.trangThai,
        ngayBatDau: form.ngayBatDau || null,
        ngayKetThuc: form.ngayKetThuc || null,
        soLuongGioiHan,
        ghiChu: form.ghiChu || null,
        maKM: null,
        loaiKM: 'STANDARD',
        scopeType: form.scopeType,
        scopeTargetIds,
        rules,
      };

      await axiosClient.post('/admin/coupons', payload);
      resetForm();
      await fetchCoupons();
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tạo được mã giảm giá');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleCouponStatus = async (couponId: number, nextStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      setError(null);
      await axiosClient.patch(`/admin/coupons/${couponId}/status`, {
        trangThai: nextStatus,
      });
      await fetchCoupons();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không cập nhật được trạng thái');
    }
  };

  return {
    loading,
    saving,
    search,
    setSearch,
    status,
    setStatus,
    summary,
    coupons,
    scopeOptions,
    scopeOptionsLoading,
    scopeSearch,
    setScopeSearch,
    form,
    setForm,
    error,
    resetForm,
    submitCoupon,
    toggleCouponStatus,
    updateRule,
    addRule,
    removeRule,
    fetchCoupons,
  };
}
