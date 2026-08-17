import DOMPurify from "dompurify";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  Hash,
  MessageCircle,
  RefreshCw,
  Send,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AdminLayout from "../../../layouts/AdminLayout";
import Pagination from "../../../components/Pagination";
import { useAdminForumPostDetail } from "./hooks/useAdminForumPostDetail";
import type { AdminForumAnswer } from "./hooks/useAdminForumPostDetail";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Author({
  answer,
}: {
  answer: { tacGia: AdminForumAnswer["tacGia"] };
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-50 font-bold text-emerald-700">
        {answer.tacGia.anhDaiDien ? (
          <img
            src={answer.tacGia.anhDaiDien}
            alt={answer.tacGia.hoTen}
            className="h-full w-full object-cover"
          />
        ) : (
          answer.tacGia.hoTen?.charAt(0)?.toUpperCase() || "?"
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">
          {answer.tacGia.hoTen}
        </p>
      </div>
    </div>
  );
}

function AnswerCard({
  answer,
  nested = false,
  repliesExpanded,
  onToggleReplies,
  isRepliesExpanded,
}: {
  answer: AdminForumAnswer;
  nested?: boolean;
  repliesExpanded: boolean;
  onToggleReplies: (answerId: number) => void;
  isRepliesExpanded: (answerId: number) => boolean;
}) {
  const isRevoked = answer.trangThai === "REVOKED";
  const isBanned = answer.trangThai === "BANNED";

  return (
    <article
      className={
        nested
          ? "rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      }
      aria-label={nested ? "Phản hồi lồng nhau" : "Câu trả lời"}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Author answer={answer} />
        <time className="inline-flex items-center rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-100">
          {formatDate(answer.ngayTao)}
        </time>
      </div>

      {isRevoked || isBanned ? (
        <div
          className={
            isRevoked
              ? "mt-4 rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm italic text-slate-500"
              : "mt-4 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm italic text-rose-600"
          }
        >
          {isRevoked
            ? "Bình luận đã bị người dùng thu hồi."
            : "Bình luận đã bị quản trị viên gỡ bỏ."}
        </div>
      ) : (
        <div
          className={
            nested
              ? "prose prose-slate mt-4 max-w-none rounded-xl border border-emerald-100 bg-white/80 p-4 text-sm"
              : "prose prose-slate mt-4 max-w-none rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm"
          }
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(answer.noiDung),
          }}
        />
      )}

      {answer.cacPhanHoi.length > 0 && (
        <div className="relative mt-5 ml-3 space-y-3 border-l-2 border-emerald-200 pl-4 sm:ml-6 sm:pl-5">
          <button
            type="button"
            onClick={() => onToggleReplies(answer.maCTL)}
            aria-expanded={repliesExpanded}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-100"
          >
            {repliesExpanded ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
            {answer.cacPhanHoi.length} phản hồi
          </button>
          {repliesExpanded && (
            <div className="space-y-3">
              {answer.cacPhanHoi.map((reply) => (
                <AnswerCard
                  key={reply.maCTL}
                  answer={reply}
                  nested
                  repliesExpanded={isRepliesExpanded(reply.maCTL)}
                  onToggleReplies={onToggleReplies}
                  isRepliesExpanded={isRepliesExpanded}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function AdminForumPostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questionId = Number(id);
  const {
    post,
    loading,
    refreshing,
    replying,
    deleting,
    answerPage,
    setAnswerPage,
    refresh,
    submitReply,
    deletePost,
  } = useAdminForumPostDetail(Number.isFinite(questionId) ? questionId : null);
  const [reply, setReply] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collapsedReplyLists, setCollapsedReplyLists] = useState<
    Record<number, boolean>
  >({});

  const toggleReplyList = (answerId: number) => {
    setCollapsedReplyLists((current) => ({
      ...current,
      [answerId]: !current[answerId],
    }));
  };

  const isRepliesExpanded = (answerId: number) =>
    !collapsedReplyLists[answerId];

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await submitReply(reply);
    if (success) setReply("");
  };

  const handleDelete = async () => {
    const success = await deletePost();
    if (success) navigate("/admin/forum");
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/admin/forum"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <ArrowLeft size={17} />
            Quay lại danh sách
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!post || deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Xóa bài đăng
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Đang tải chi tiết bài đăng...
          </div>
        ) : post ? (
          <>
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      {post.trangThai}
                    </span>
                    {post.danhSachThe.map((tag) => (
                      <span
                        key={tag.maThe}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        <Tag size={12} /> {tag.tenThe}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">
                    {post.tieuDe}
                  </h1>
                  <p className="mt-3 text-sm text-slate-500">
                    Đăng ngày {formatDate(post.ngayTao)} · Cập nhật{" "}
                    {formatDate(post.ngayCapNhat)}
                  </p>
                </div>
                <Author answer={{ tacGia: post.tacGia }} />
              </div>

              <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                  <Eye size={15} /> {post.luotXem} lượt xem
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                  <Hash size={15} /> {post.luotBinhChon} bình chọn
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                  <MessageCircle size={15} /> {post.soCauTraLoi} câu trả lời
                </span>
              </div>

              <div
                className="prose prose-slate mt-8 max-w-none border-t border-slate-100 pt-7"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.noiDung),
                }}
              />
            </article>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-900">
                  Câu trả lời ({post.tongSoCauTraLoi})
                </h2>
              </div>
              <div className="mt-5 space-y-4">
                {post.danhSachTraLoi.length > 0 ? (
                  post.danhSachTraLoi.map((answer) => (
                    <AnswerCard
                      key={answer.maCTL}
                      answer={answer}
                      repliesExpanded={isRepliesExpanded(answer.maCTL)}
                      onToggleReplies={toggleReplyList}
                      isRepliesExpanded={isRepliesExpanded}
                    />
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Chưa có câu trả lời nào.
                  </p>
                )}
              </div>

              {post.tongSoCauTraLoi > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-center text-xs text-slate-500">
                    Hiển thị {(answerPage - 1) * post.gioiHanCauTraLoi + 1}-
                    {Math.min(
                      answerPage * post.gioiHanCauTraLoi,
                      post.tongSoCauTraLoi,
                    )}
                    /{post.tongSoCauTraLoi} câu trả lời
                  </p>
                  <Pagination
                    currentPage={answerPage}
                    totalPages={post.tongSoTrangCauTraLoi}
                    onPageChange={setAnswerPage}
                    totalItems={post.tongSoCauTraLoi}
                    indexOfFirst={(answerPage - 1) * post.gioiHanCauTraLoi}
                    indexOfLast={Math.min(
                      answerPage * post.gioiHanCauTraLoi,
                      post.tongSoCauTraLoi,
                    )}
                    variant="numbers"
                  />
                </div>
              )}

              <form
                onSubmit={handleReply}
                className="mt-7 border-t border-slate-100 pt-6"
              >
                <label
                  htmlFor="admin-forum-reply"
                  className="text-sm font-bold text-slate-900"
                >
                  Trả lời với tư cách quản trị viên
                </label>
                <textarea
                  id="admin-forum-reply"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Nhập nội dung phản hồi..."
                  rows={5}
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={replying || !reply.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={16} />
                    {replying ? "Đang gửi..." : "Đăng trả lời"}
                  </button>
                </div>
              </form>
            </section>
          </>
        ) : (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-10 text-center text-rose-700">
            Không thể tải bài đăng diễn đàn.
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Xóa bài đăng?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Bài đăng và toàn bộ câu trả lời liên quan sẽ bị xóa. Thao tác
                  này không thể hoàn tác.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deleting ? "Đang xóa..." : "Xóa bài đăng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
