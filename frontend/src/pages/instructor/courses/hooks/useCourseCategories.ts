import { useEffect, useState } from 'react';
import axiosClient from '../../../../api/axios'; // Đảm bảo đường dẫn import axiosClient chuẩn xác

export type CategoryOption = {
    maDM: number;
    tenDM: string;
};

export function useCourseCategories() {
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                // Gọi đến API bạn vừa hoàn thiện ở Backend
                const response = await axiosClient.get<any>('/categories');
                const data = response.data || response;

                if (Array.isArray(data)) {
                    setCategories(
                        data
                            .map((category) => ({
                                maDM: Number(category?.maDM),
                                tenDM: String(category?.tenDM ?? ''),
                            }))
                            .filter(
                                (category) =>
                                    Number.isFinite(category.maDM) &&
                                    category.tenDM.trim().length > 0,
                            ),
                    );
                }
            } catch (error) {
                console.error('Lỗi khi tải danh mục từ hệ thống:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchCategories();
    }, []);

    return { categories, isLoading };
}
