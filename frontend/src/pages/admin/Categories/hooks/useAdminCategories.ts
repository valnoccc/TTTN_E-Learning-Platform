import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axiosClient from '../../../../api/axios';

export interface AdminCategoryItem {
    maDM: number;
    tenDM: string;
    moTa: string | null;
}

interface CategoryFormPayload {
    TenDM: string;
    MoTa?: string;
}

export function useAdminCategories() {
    const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response: any = await axiosClient.get('/admin/categories', {
                params: { search: search.trim() || undefined },
            });
            setCategories(Array.isArray(response?.data) ? response.data : []);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể tải danh mục.');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCategories();
    }, [search]);

    const createCategory = async (payload: CategoryFormPayload) => {
        try {
            await axiosClient.post('/admin/categories', payload);
            toast.success('Đã thêm danh mục.');
            await loadCategories();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể thêm danh mục.');
            throw error;
        }
    };

    const updateCategory = async (id: number, payload: CategoryFormPayload) => {
        try {
            await axiosClient.patch(`/admin/categories/${id}`, payload);
            toast.success('Đã cập nhật danh mục.');
            await loadCategories();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể cập nhật danh mục.');
            throw error;
        }
    };

    const deleteCategory = async (id: number) => {
        try {
            await axiosClient.delete(`/admin/categories/${id}`);
            toast.success('Đã xóa danh mục.');
            await loadCategories();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể xóa danh mục.');
            throw error;
        }
    };

    return {
        categories,
        loading,
        search,
        setSearch,
        reloadCategories: loadCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    };
}
