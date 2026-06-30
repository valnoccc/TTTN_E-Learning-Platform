import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '../../../../api/axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export type LoaiKM = 'FIRST_TIME' | 'CROSS_SELL' | 'HOLIDAY' | 'STANDARD';

export interface AdminCouponItem {
    maCoupon: number;
    maCode: string;
    maKM: string | null;
    giaTriGiam: number;
    loaiGiam: 'PERCENT' | 'AMOUNT';
    loaiKM: LoaiKM | null;
    trangThai: 'ACTIVE' | 'INACTIVE';
    ngayBatDau: string | null;
    ngayKetThuc: string | null;
    maKH: number | null;
    tenKhoaHoc: string | null;
    soLuongGioiHan: number | null;
    soLuongDaDung: number;
    ghiChu: string | null;
}

export interface AdminCouponSummary {
    total: number;
    activeCount: number;
    crossSellActive: number;
    firstTimeActive: number;
    totalUsed: number;
}

export interface CreateAdminCouponPayload {
    maCode: string;
    maKM?: string | null;
    loaiKM: LoaiKM;
    giaTriGiam: number;
    loaiGiam?: 'PERCENT' | 'AMOUNT';
    trangThai?: 'ACTIVE' | 'INACTIVE';
    ngayBatDau?: string | null;
    ngayKetThuc?: string | null;
    maKH?: number | null;
    soLuongGioiHan?: number | null;
    ghiChu?: string | null;
}

export interface QueryCouponsFilter {
    search?: string;
    loaiKM?: LoaiKM | '';
    trangThai?: 'ACTIVE' | 'INACTIVE' | '';
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAdminCoupons() {
    const [coupons, setCoupons] = useState<AdminCouponItem[]>([]);
    const [summary, setSummary] = useState<AdminCouponSummary>({
        total: 0, activeCount: 0, crossSellActive: 0, firstTimeActive: 0, totalUsed: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<QueryCouponsFilter>({});

    const abortRef = useRef<AbortController | null>(null);

    const fetchCoupons = useCallback(async (currentFilter: QueryCouponsFilter) => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilter.search?.trim()) params.set('search', currentFilter.search.trim());
            if (currentFilter.loaiKM) params.set('loaiKM', currentFilter.loaiKM);
            if (currentFilter.trangThai) params.set('trangThai', currentFilter.trangThai);

            const response: any = await axiosClient.get(
                `/admin/coupons?${params.toString()}`,
            );
            const data = response?.data ?? response;
            setCoupons(data?.items ?? []);
            setSummary(data?.summary ?? { total: 0, activeCount: 0, crossSellActive: 0, firstTimeActive: 0, totalUsed: 0 });
        } catch (err: any) {
            if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
                setError(err?.response?.data?.message ?? 'Lỗi tải danh sách mã khuyến mãi');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchCoupons(filter);
        return () => abortRef.current?.abort();
    }, [fetchCoupons, filter]);

    const createCoupon = useCallback(async (payload: CreateAdminCouponPayload) => {
        const response: any = await axiosClient.post('/admin/coupons', payload);
        const created = response?.data ?? response;
        await fetchCoupons(filter);
        return created;
    }, [fetchCoupons, filter]);

    const updateCoupon = useCallback(async (id: number, payload: Partial<CreateAdminCouponPayload>) => {
        const response: any = await axiosClient.patch(`/admin/coupons/${id}/status`, payload);
        const updated = response?.data ?? response;
        await fetchCoupons(filter);
        return updated;
    }, [fetchCoupons, filter]);

    const deleteCoupon = useCallback(async (id: number) => {
        await axiosClient.delete(`/admin/coupons/${id}`);
        await fetchCoupons(filter);
    }, [fetchCoupons, filter]);

    const toggleStatus = useCallback(async (coupon: AdminCouponItem) => {
        const newStatus: 'ACTIVE' | 'INACTIVE' =
            coupon.trangThai === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await updateCoupon(coupon.maCoupon, { trangThai: newStatus });
    }, [updateCoupon]);

    return {
        coupons,
        summary,
        loading,
        error,
        filter,
        setFilter,
        createCoupon,
        updateCoupon,
        deleteCoupon,
        toggleStatus,
        refetch: () => fetchCoupons(filter),
    };
}
