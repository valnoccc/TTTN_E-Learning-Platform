import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import axiosClient from '../../../../api/axios';

export type ForumTag = {
  maThe: number;
  tenThe: string;
  duongDan: string;
};

export type ForumAuthor = {
  maND: number;
  hoTen: string;
  anhDaiDien: string | null;
};

export type ForumQuestion = {
  maCH: number;
  tieuDe: string;
  noiDung: string;
  noiDungTomTat: string;
  luotXem: number;
  luotBinhChon: number;
  soCauTraLoi: number;
  ngayTao: string;
  ngayCapNhat: string;
  tacGia: ForumAuthor;
  danhSachThe: ForumTag[];
};

export type ForumBoardSummary = {
  totalQuestions: number;
  totalReplies: number;
  totalViews: number;
};

type ForumBoardResponse = {
  data: ForumQuestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: ForumBoardSummary;
};

const PAGE_SIZE = 20;

function normalizeText(value: string, maxLength = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return 'Không có nội dung.';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

export function useAdminForumPosts() {
  const [items, setItems] = useState<ForumQuestion[]>([]);
  const [summary, setSummary] = useState<ForumBoardSummary>({
    totalQuestions: 0,
    totalReplies: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<ForumQuestion | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (search) {
        params.set('search', search);
      }

      const response = await axiosClient.get<ForumBoardResponse>(
        `/forum/admin/questions?${params.toString()}`,
      );

      setItems(response.data ?? []);
      setTotal(response.total ?? 0);
      setTotalPages(response.totalPages ?? 1);
      setSummary(
        response.summary ?? {
          totalQuestions: 0,
          totalReplies: 0,
          totalViews: 0,
        },
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Không thể tải danh sách bài đăng diễn đàn',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageStart = useMemo(
    () => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1),
    [page, total],
  );
  const pageEnd = useMemo(
    () => (total === 0 ? 0 : Math.min(page * PAGE_SIZE, total)),
    [page, total],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    const target = questionToDelete;
    setDeletingId(target.maCH);

    try {
      await axiosClient.delete(`/forum/admin/questions/${target.maCH}`);
      toast.success('Đã xóa bài đăng diễn đàn');
      setQuestionToDelete(null);

      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadQuestions();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Xóa bài đăng thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return {
    items,
    summary,
    loading,
    refreshing,
    page,
    setPage,
    totalPages,
    total,
    searchInput,
    setSearchInput,
    deletingId,
    questionToDelete,
    setQuestionToDelete,
    handleRefresh,
    handleDelete,
    pageStart,
    pageEnd,
    normalizeText,
  };
}
