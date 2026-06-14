import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export type CouponStatus = 'ACTIVE' | 'INACTIVE';
export type CouponDiscountType = 'PERCENT' | 'AMOUNT';

export interface InstructorCouponSummary {
  totalCouponCount: number;
  activeCount: number;
  totalUsageCount: number;
}

export interface InstructorCouponItem {
  maCoupon: number;
  maCode: string;
  giaTriGiam: number;
  loaiGiam: CouponDiscountType;
  trangThai: CouponStatus;
  ngayBatDau: string | null;
  ngayKetThuc: string | null;
  maKH: number;
  tenKhoaHoc: string;
  soLuongGioiHan: number | null;
  soLuongDaDung: number;
  ghiChu: string | null;
}

export interface InstructorCourseOption {
  id: number;
  title: string;
}

export interface CreateCouponFormState {
  maKH: string;
  maCode: string;
  loaiGiam: CouponDiscountType;
  giaTriGiam: string;
  soLuongGioiHan: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  ghiChu: string;
}

const DEFAULT_FORM: CreateCouponFormState = {
  maKH: '',
  maCode: '',
  loaiGiam: 'PERCENT',
  giaTriGiam: '',
  soLuongGioiHan: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  ghiChu: '',
};

function unwrapCouponResponse(response: unknown): {
  summary: InstructorCouponSummary;
  items: InstructorCouponItem[];
} {
  const payload =
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: unknown }).data &&
    typeof (response as { data?: unknown }).data === 'object' &&
    'data' in ((response as { data: object }).data)
      ? ((response as { data: { data?: unknown } }).data).data
      : response &&
          typeof response === 'object' &&
          'data' in response &&
          (response as { data?: unknown }).data &&
          typeof (response as { data?: unknown }).data === 'object'
        ? (response as {
            data: {
              summary: InstructorCouponSummary;
              items: InstructorCouponItem[];
            };
          }).data
        : response;

  const normalized = payload as
    | { summary?: InstructorCouponSummary; items?: InstructorCouponItem[] }
    | undefined;

  return {
    summary: normalized?.summary ?? {
      totalCouponCount: 0,
      activeCount: 0,
      totalUsageCount: 0,
    },
    items: normalized?.items ?? [],
  };
}

function unwrapCourses(response: unknown): InstructorCourseOption[] {
  const data =
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: unknown }).data &&
    typeof (response as { data?: unknown }).data === 'object' &&
    'data' in ((response as { data: object }).data)
      ? ((response as { data: { data?: unknown } }).data).data
      : response &&
          typeof response === 'object' &&
          'data' in response
        ? (response as { data?: unknown }).data
        : response;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((course: Record<string, unknown>) => ({
    id: Number(course.id ?? course.maKH ?? 0),
    title: String(course.ten_khoa_hoc ?? course.tenKhoaHoc ?? course.title ?? ''),
  }));
}

export function useInstructorCoupons() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<InstructorCouponSummary>({
    totalCouponCount: 0,
    activeCount: 0,
    totalUsageCount: 0,
  });
  const [items, setItems] = useState<InstructorCouponItem[]>([]);
  const [courses, setCourses] = useState<InstructorCourseOption[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CouponStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateCouponFormState>(DEFAULT_FORM);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/instructor/coupons');
      const data = unwrapCouponResponse(response);
      setSummary(data.summary);
      setItems(data.items);
    } catch {
      toast.error('Không thể tải danh sách mã giảm giá');
      setSummary({
        totalCouponCount: 0,
        activeCount: 0,
        totalUsageCount: 0,
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await axiosClient.get('/courses/my-courses');
      setCourses(unwrapCourses(response));
    } catch {
      toast.error('Không thể tải danh sách khóa học');
      setCourses([]);
    }
  };

  useEffect(() => {
    void Promise.all([loadCoupons(), loadCourses()]);
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.maCode.toLowerCase().includes(normalizedSearch) ||
        item.tenKhoaHoc.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'ALL' || item.trangThai === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchValue, statusFilter]);

  const handleOpenModal = () => {
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setForm(DEFAULT_FORM);
  };

  const updateForm = (field: keyof CreateCouponFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const generateRandomCode = () => {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    updateForm('maCode', `EDU${random}`);
  };

  const handleCreateCoupon = async () => {
    if (!form.maKH || !form.maCode.trim() || !form.giaTriGiam.trim()) {
      toast.error('Vui lòng nhập đầy đủ khóa học, mã code và mức giảm');
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosClient.post('/instructor/coupons', {
        maKH: Number(form.maKH),
        maCode: form.maCode.trim(),
        loaiGiam: form.loaiGiam,
        giaTriGiam: Number(form.giaTriGiam),
        soLuongGioiHan: form.soLuongGioiHan.trim()
          ? Number(form.soLuongGioiHan)
          : null,
        ngayBatDau: form.ngayBatDau || null,
        ngayKetThuc: form.ngayKetThuc || null,
        ghiChu: form.ghiChu.trim() || null,
      });
      toast.success('Tạo mã giảm giá thành công');
      handleCloseModal();
      await loadCoupons();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Không thể tạo mã giảm giá mới',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon: InstructorCouponItem) => {
    const nextStatus: CouponStatus =
      coupon.trangThai === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await axiosClient.patch(`/instructor/coupons/${coupon.maCoupon}/status`, {
        trangThai: nextStatus,
      });
      setItems((current) =>
        current.map((item) =>
          item.maCoupon === coupon.maCoupon
            ? { ...item, trangThai: nextStatus }
            : item,
        ),
      );
      setSummary((current) => ({
        ...current,
        activeCount:
          nextStatus === 'ACTIVE'
            ? current.activeCount + 1
            : Math.max(0, current.activeCount - 1),
      }));
      toast.success('Đã cập nhật trạng thái mã giảm giá');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Không thể cập nhật trạng thái mã giảm giá',
      );
    }
  };

  return {
    loading,
    isSubmitting,
    summary,
    items: filteredItems,
    totalItems: filteredItems.length,
    courses,
    searchValue,
    setSearchValue,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    form,
    updateForm,
    handleOpenModal,
    handleCloseModal,
    handleCreateCoupon,
    handleToggleStatus,
    generateRandomCode,
  };
}
