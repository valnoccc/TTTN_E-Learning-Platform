import { useEffect, useState } from 'react';
import axiosClient from '../../../api/axios';

export type CourseCategoryOption = {
  maDM: number;
  tenDM: string;
};

function normalizeCategories(payload: any): CourseCategoryOption[] {
  const rawCategories = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  return rawCategories
    .map((category: any) => ({
      maDM: Number(category?.maDM),
      tenDM: String(category?.tenDM ?? '').trim(),
    }))
    .filter(
      (category: CourseCategoryOption) =>
        Number.isFinite(category.maDM) && category.tenDM.length > 0,
    )
    .sort((a: CourseCategoryOption, b: CourseCategoryOption) =>
      a.tenDM.localeCompare(b.tenDM, 'vi'),
    );
}

export function useCourseCategories() {
  const [categories, setCategories] = useState<CourseCategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await axiosClient.get('/categories');
        const normalizedCategories = normalizeCategories(response);

        if (isMounted) {
          setCategories(normalizedCategories);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh mục khóa học:', error);
        if (isMounted) {
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, isLoading };
}
