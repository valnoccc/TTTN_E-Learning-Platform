import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import axiosClient from '../../../../api/axios';
import type { ForumAuthor, ForumTag } from './useAdminForumPosts';

export type AdminForumAnswer = {
  maCTL: number;
  noiDung: string;
  trangThai: string;
  luotBinhChon: number;
  laDapAnDung: boolean;
  ngayTao: string;
  ngayCapNhat: string;
  maCTLCha: number | null;
  tacGia: ForumAuthor;
  cacPhanHoi: AdminForumAnswer[];
};

export type AdminForumPostDetail = {
  maCH: number;
  tieuDe: string;
  noiDung: string;
  noiDungTomTat: string;
  trangThai: string;
  luotXem: number;
  luotBinhChon: number;
  soCauTraLoi: number;
  ngayTao: string;
  ngayCapNhat: string;
  tacGia: ForumAuthor;
  danhSachThe: ForumTag[];
  danhSachTraLoi: AdminForumAnswer[];
  tongSoCauTraLoi: number;
  trangCauTraLoi: number;
  gioiHanCauTraLoi: number;
  tongSoTrangCauTraLoi: number;
};

const ANSWERS_PER_PAGE = 10;

export function useAdminForumPostDetail(questionId: number | null) {
  const [post, setPost] = useState<AdminForumPostDetail | null>(null);
  const [answerPage, setAnswerPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadPost = useCallback(async (requestedPage = 1) => {
    if (!questionId) {
      setPost(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosClient.get<{ data: AdminForumPostDetail }>(
        `/forum/admin/questions/${questionId}`,
        { params: { page: requestedPage, limit: ANSWERS_PER_PAGE } },
      );
      setPost(response.data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Không thể tải chi tiết bài đăng diễn đàn',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [questionId]);

  useEffect(() => {
    setAnswerPage(1);
  }, [questionId]);

  useEffect(() => {
    void loadPost(answerPage);
  }, [answerPage, loadPost]);

  const refresh = async () => {
    setRefreshing(true);
    await loadPost(answerPage);
  };

  const submitReply = async (noiDung: string) => {
    if (!questionId || !noiDung.trim()) return false;

    setReplying(true);
    try {
      await axiosClient.post(`/forum/admin/questions/${questionId}/answers`, {
        noiDung: noiDung.trim(),
      });
      toast.success('Đã đăng câu trả lời với tư cách quản trị viên');
      await loadPost(answerPage);
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đăng câu trả lời');
      return false;
    } finally {
      setReplying(false);
    }
  };

  const deletePost = async () => {
    if (!questionId) return false;

    setDeleting(true);
    try {
      await axiosClient.delete(`/forum/admin/questions/${questionId}`);
      toast.success('Đã xóa bài đăng diễn đàn');
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Xóa bài đăng thất bại');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    post,
    answerPage,
    setAnswerPage,
    loading,
    refreshing,
    replying,
    deleting,
    refresh,
    submitReply,
    deletePost,
  };
}
