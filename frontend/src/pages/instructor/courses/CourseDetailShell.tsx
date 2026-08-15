import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeInfo,
  BookOpen,
  FileEdit,
  HelpCircle,
  Layers3,
  Trash2,
  Bookmark,
  Loader2,
  ShieldAlert,
  MessageSquareWarning,
} from "lucide-react";
import toast from "react-hot-toast";

import { PolicyModal } from "../../../components/common/PolicyModal";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import InstructorLayout from "../../../layouts/InstructorLayout";
import {
  useCourseDetail,
  type InstructorCourseContextValue,
  type ViolatingLesson,
} from "./hooks/useCourseDetail";

const InstructorCourseContext =
  createContext<InstructorCourseContextValue | null>(null);

const detailTabs = [
  {
    key: "overview",
    label: "Tổng quan",
    to: "overview",
    icon: <FileEdit size={15} />,
  },
  {
    key: "lessons",
    label: "Bài học",
    to: "lessons",
    icon: <BookOpen size={15} />,
  },
  {
    key: "questions",
    label: "Câu hỏi",
    to: "questions",
    icon: <HelpCircle size={15} />,
  },
] as const;

interface InstructorCourseDetailProps {
  mode?: "create" | "edit";
  children?: ReactNode;
}

export default function InstructorCourseDetail({
  mode = "edit",
  children,
}: InstructorCourseDetailProps) {
  const course = useCourseDetail({ mode });
  const {
    id,
    isNewCourse,
    isLocked,
    formData,
    lessons,
    isDeleteModalOpen,
    handleSave,
    handleDeleteCourse,
    confirmDelete,
    setIsDeleteModalOpen,
    handleStatusChange,
    handleAppealSubmit,
    navigate,
    isSaving,
    isStatusChanging,
  } = course as any;

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishPolicyAgreed, setIsPublishPolicyAgreed] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    isOpen: boolean;
    actionText: string;
  } | null>(null);

  // ─── State cho Appeal Modal ────────────────────────────────────────────────
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [violatingLessons, setViolatingLessons] = useState<ViolatingLesson[]>(
    [],
  );
  const [appealReason, setAppealReason] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  // ──────────────────────────────────────────────────────────────────────────

  const videoLessons = (lessons ?? []).filter((lesson: any) =>
    Boolean(lesson.video_url || lesson.videoUrl),
  );
  const getAiStatus = (lesson: any) =>
    String(lesson.aiStatus ?? "").trim().toUpperCase();
  const processingLessons = videoLessons.filter((lesson: any) =>
    ["PROCESSING", "PENDING"].includes(getAiStatus(lesson)),
  );
  const needsReviewLessons = videoLessons.filter(
    (lesson: any) => getAiStatus(lesson) === "NEEDS_REVIEW",
  );
  const rejectedVideoLessons = videoLessons.filter(
    (lesson: any) => getAiStatus(lesson) === "REJECTED",
  );
  const unmoderatedLessons = videoLessons.filter(
    (lesson: any) => !getAiStatus(lesson),
  );
  const isAiChecking = processingLessons.length > 0;
  const isTechnicalAiReject = (lesson: any) => {
    const reason = String(lesson?.aiRejectReason ?? "").toLowerCase();
    return (
      reason.includes("lỗi kỹ thuật") ||
      reason.includes("invalid_argument") ||
      reason.includes("request contains an invalid argument")
    );
  };
  const disablePublish =
    isSaving || isStatusChanging || isAiChecking || videoLessons.length === 0;
  let publishBtnTitle = "";
  if (videoLessons.length === 0) {
    publishBtnTitle = "Khóa học chưa có video bài giảng";
  } else if (isAiChecking) {
    publishBtnTitle = "Có video đang được AI xử lý";
  } else if (rejectedVideoLessons.length > 0) {
    publishBtnTitle =
      `Có ${rejectedVideoLessons.length} video bị AI từ chối. Hãy chỉnh sửa hoặc gửi kháng cáo.`;
  } else if (needsReviewLessons.length > 0) {
    publishBtnTitle =
      `Có ${needsReviewLessons.length} video cần admin xem xét thêm.`;
  } else if (unmoderatedLessons.length > 0) {
    publishBtnTitle =
      `Có ${unmoderatedLessons.length} video chưa có kết quả kiểm duyệt AI.`;
  } else {
    publishBtnTitle = "Tất cả video đã được AI kiểm duyệt.";
  }
  const courseReviewBanner = (() => {
    if (videoLessons.length === 0) {
      return {
        tone: "sky",
        title: "Khóa học chưa có video bài giảng",
        description: "",
      };
    }

    if (isAiChecking) {
      return {
        tone: "amber",
        title: `AI đang kiểm duyệt ${processingLessons.length}/${videoLessons.length} video`,
        description:
          "Vui lòng đợi kết quả kiểm duyệt trước khi gửi yêu cầu duyệt khóa học.",
      };
    }

    if (rejectedVideoLessons.length > 0) {
      return {
        tone: "rose",
        title: `Có ${rejectedVideoLessons.length} video bị AI từ chối`,
        description:
          "Hãy chỉnh sửa hoặc thay thế video. Bạn vẫn có thể gửi kháng cáo để admin xem xét.",
      };
    }

    if (needsReviewLessons.length > 0) {
      return {
        tone: "amber",
        title: `Có ${needsReviewLessons.length} video cần admin xem xét thêm`,
        description: "AI chưa thể kết luận chắc chắn về các video này.",
      };
    }

    if (unmoderatedLessons.length > 0) {
      return {
        tone: "sky",
        title: `Có ${unmoderatedLessons.length} video chưa có kết quả AI`,
        description:
          "Video này chưa được AI kiểm duyệt hoặc không hỗ trợ kiểm duyệt tự động.",
      };
    }

    return {
      tone: "emerald",
      title: `Tất cả ${videoLessons.length} video đã được AI kiểm duyệt`,
      description: "Bạn có thể gửi yêu cầu để admin duyệt khóa học.",
    };
  })();

  useEffect(() => {
    const rejectedLessons = (lessons ?? []).filter(
      (lesson: any) => lesson.aiStatus === "REJECTED",
    );
    if (rejectedLessons.length > 0) {
      console.groupCollapsed(
        `[Course AI Debug] Khóa học ${formData.title || id || ""} có ${rejectedLessons.length} bài học bị từ chối`,
      );
      console.table(
        rejectedLessons.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.tieu_de,
          aiStatus: lesson.aiStatus,
          aiRejectReason: lesson.aiRejectReason || "no reason provided",
          rejectType: isTechnicalAiReject(lesson) ? "ky_thuat" : "vi_pham",
          videoUrl: lesson.video_url || "",
        })),
      );
      console.groupEnd();
    }
  }, [formData.title, id, lessons]);

  /** Xử lý click "Gửi yêu cầu duyệt": gọi API, nếu có video REJECTED thì mở Appeal Modal */
  const handleSubmitForReview = async () => {
    if (isAiChecking) {
      toast.error(
        "Khóa học có video đang được AI xử lý. Vui lòng đợi hoàn tất.",
      );
      return;
    }
    if (!isPublishPolicyAgreed) {
      toast.error("Vui lòng đồng ý với Chính sách nền tảng");
      return;
    }
    setIsPublishModalOpen(false);

    const result = await handleStatusChange("PENDING", {
      isPolicyAgreed: isPublishPolicyAgreed,
    });
    if (result?.violatingLessons && result.violatingLessons.length > 0) {
      setViolatingLessons(result.violatingLessons);
      setAppealReason("");
      setIsAppealModalOpen(true);
    }
  };

  /** Xử lý click "Gửi Kháng Cáo" trong Appeal Modal */
  const handleConfirmAppeal = async () => {
    if (!appealReason.trim()) {
      toast.error("Vui lòng nhập lý do kháng cáo trước khi gửi.");
      return;
    }
    setIsSubmittingAppeal(true);
    try {
      await handleAppealSubmit(appealReason.trim());
      setIsAppealModalOpen(false);
      setViolatingLessons([]);
      setAppealReason("");
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <InstructorLayout>
      <InstructorCourseContext.Provider value={course}>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <button
                    onClick={() => navigate("/instructor/courses")}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ArrowLeft size={16} />
                    Quay lại
                  </button>
                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
                    {isNewCourse
                      ? "Tạo khóa học mới"
                      : formData.title || "Đang tải..."}
                  </h1>
                </div>

                <div className="flex flex-col items-start gap-4 xl:items-end">
                  {courseReviewBanner ? (
                    <div
                      className={`max-w-xl rounded-xl border px-4 py-3 text-sm shadow-sm ${
                        courseReviewBanner.tone === "amber"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : courseReviewBanner.tone === "rose"
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : courseReviewBanner.tone === "sky"
                              ? "border-sky-200 bg-sky-50 text-sky-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold">
                            {courseReviewBanner.title}
                          </p>
                          <p className="mt-1 leading-5">
                            {courseReviewBanner.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {!isNewCourse && (
                    <StatusActions
                      status={formData.trang_thai}
                      onAction={() =>
                        setConfirmStatusModal({
                          isOpen: true,
                          actionText:
                            formData.trang_thai === "PUBLISHED"
                              ? "tạm ẩn khóa học"
                              : formData.trang_thai === "PENDING"
                                ? "hủy yêu cầu duyệt"
                                : "hủy kháng cáo",
                        })
                      }
                    />
                  )}

                  <div className="mt-1 flex flex-wrap justify-end gap-2">
                    {!isLocked && !isNewCourse ? (
                      <button
                        onClick={handleDeleteCourse}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-red-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                        Xóa khóa học
                      </button>
                    ) : null}

                    {!isLocked ? (
                      <button
                        onClick={() => void handleSave()}
                        disabled={isSaving || isStatusChanging}
                        className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Bookmark size={16} />
                        )}
                        {isNewCourse ? "Tạo bản nháp" : "Lưu thay đổi"}
                      </button>
                    ) : null}

                    {!isLocked && !isNewCourse ? (
                      <button
                        onClick={() => {
                          if (isAiChecking) {
                            toast.error(
                              "Khóa học có video đang được AI xử lý. Vui lòng đợi hoàn tất.",
                            );
                            return;
                          }
                          setIsPublishModalOpen(true);
                        }}
                        disabled={disablePublish}
                        title={publishBtnTitle}
                        className="inline-flex items-center gap-2 rounded-md bg-[#1dbf73] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#169b5c] hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStatusChanging ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <BadgeInfo size={16} />
                        )}
                        Gửi yêu cầu duyệt
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {!isNewCourse ? (
              <>
                <div className="border-b border-slate-200 bg-white px-6 sm:px-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3">
                    {detailTabs.map((tab, index) => (
                      <NavLink
                        key={tab.key}
                        to={tab.to}
                        className={({ isActive }) =>
                          `flex min-h-[84px] items-center gap-3 border-b-[3px] px-4 py-4 text-left transition-all duration-200 sm:px-6 ${
                            isActive
                              ? "border-[#1dbf73] bg-white text-[#169b5c]"
                              : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`
                        }
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-slate-50 text-slate-500 [&>svg]:h-6 [&>svg]:w-6">
                          {tab.icon}
                        </span>
                        <span>
                          <span className="block text-sm font-extrabold tracking-wide sm:text-base">
                            {String(index + 1).padStart(2, "0")}.{tab.label}
                          </span>
                          <span className="mt-1 block text-xs font-medium text-slate-400">
                            {tab.key === "overview"
                              ? "Thông tin cơ bản"
                              : tab.key === "lessons"
                                ? "Chương và bài học"
                                : "Ngân hàng câu hỏi"}
                          </span>
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <div className="bg-slate-50/30 px-6 py-6 sm:px-8">
              {isNewCourse ? children : <Outlet />}
            </div>
          </section>
        </div>
      </InstructorCourseContext.Provider>

      {/* ─── Modals Xác Nhận ──────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa khóa học"
        message="Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác."
        confirmText="Xác nhận xóa"
        isDestructive={true}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <ConfirmModal
        isOpen={!!confirmStatusModal?.isOpen}
        title="Xác nhận"
        message={`Bạn có chắc chắn muốn ${confirmStatusModal?.actionText} này?`}
        confirmText="Xác nhận"
        isDestructive={true}
        onConfirm={() => {
          void handleStatusChange("DRAFT");
          setConfirmStatusModal(null);
        }}
        onCancel={() => setConfirmStatusModal(null)}
      />

      {/* ─── Modal Xác Nhận Gửi Duyệt (Thông thường) ────────────────────────── */}
      {isPublishModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <BadgeInfo size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Xác nhận gửi duyệt
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Bạn có chắc chắn muốn gửi yêu cầu duyệt khóa học này không?
                  Khóa học sẽ được kiểm tra nội dung để đảm bảo chất lượng trước
                  khi được xuất bản.
                </p>
              </div>
            </div>

            <div className="mt-6 px-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={isPublishPolicyAgreed}
                    onChange={(e) => setIsPublishPolicyAgreed(e.target.checked)}
                    className="peer w-5 h-5 border-2 border-slate-300 rounded appearance-none checked:bg-[#1dbf73] checked:border-[#1dbf73] transition-colors cursor-pointer"
                  />
                  <svg
                    className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-800">
                  Tôi đã đọc và đồng ý với{" "}
                  <button
                    onClick={() => setShowPolicyModal(true)}
                    className="text-[#1dbf73] hover:underline font-bold transition-all"
                  >
                    Chính sách nền tảng
                  </button>{" "}
                  trước khi xuất bản khóa học.
                </span>
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => void handleSubmitForReview()}
                disabled={isStatusChanging || !isPublishPolicyAgreed}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1dbf73] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#169b5c] hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isStatusChanging && (
                  <Loader2 className="animate-spin" size={15} />
                )}
                Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── Modal Kháng Cáo – hiện khi có video bị AI REJECTED ─────────────── */}
      {isAppealModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start gap-4 rounded-t-2xl bg-red-50 px-6 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-inner">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-800">
                  Khóa học chứa nội dung vi phạm
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-red-700">
                  AI đã phát hiện {violatingLessons.length} bài học có video vi
                  phạm chính sách nội dung. Bạn có thể gửi kháng cáo kèm lý do
                  giải thích.
                </p>
              </div>
            </div>

            {/* Danh sách bài học vi phạm */}
            <div className="px-6 pt-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Bài học bị AI từ chối:
              </p>
              <ul className="space-y-2 rounded-lg border border-red-100 bg-red-50/60 p-3">
                {violatingLessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <MessageSquareWarning
                      size={15}
                      className="mt-0.5 shrink-0 text-red-500"
                    />
                    <span>
                      <span className="font-semibold text-slate-800">
                        {lesson.title}
                      </span>
                      {lesson.aiRejectReason && (
                        <span className="ml-1 text-slate-500">
                          — {lesson.aiRejectReason}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Textarea lý do kháng cáo */}
            <div className="px-6 pt-4">
              <label
                htmlFor="appeal-reason-input"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Lý do kháng cáo <span className="text-red-500">*</span>
              </label>
              <textarea
                id="appeal-reason-input"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Ví dụ: Video của tôi là demo lập trình, không chứa hình ảnh nhạy cảm. Tôi xin Admin xem xét lại..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#1dbf73] focus:bg-white focus:ring-2 focus:ring-[#1dbf73]/20"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 px-6 py-5">
              <button
                onClick={() => {
                  setIsAppealModalOpen(false);
                  setViolatingLessons([]);
                  setAppealReason("");
                }}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                onClick={() => void handleConfirmAppeal()}
                disabled={isSubmittingAppeal || !appealReason.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmittingAppeal && (
                  <Loader2 className="animate-spin" size={15} />
                )}
                Gửi Kháng Cáo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Render PolicyModal if needed */}
      {showPolicyModal && (
        <PolicyModal
          isOpen={showPolicyModal}
          type="instructor"
          onAccept={() => {
            setIsPublishPolicyAgreed(true);
            setShowPolicyModal(false);
          }}
          onDecline={() => setShowPolicyModal(false)}
        />
      )}
    </InstructorLayout>
  );
}

export function useInstructorCourseContext() {
  const context = useContext(InstructorCourseContext);
  if (!context) {
    throw new Error(
      "useInstructorCourseContext must be used within InstructorCourseDetail",
    );
  }
  return context;
}

export function CourseSectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border border-slate-300 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-300 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[#59708f]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function CourseSidebarCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-slate-300 bg-white">
      <div className="border-b border-slate-300 px-5 py-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-5 bg-slate-50/40 p-5">{children}</div>
    </section>
  );
}

function StatusActions({
  status,
  onAction,
}: {
  status: string;
  onAction: () => void;
}) {
  if (status === "PENDING") {
    return (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 rounded-sm border border-yellow-500 bg-transparent px-4 py-2 text-sm font-bold text-yellow-600 transition hover:bg-yellow-50"
      >
        Hủy yêu cầu duyệt
      </button>
    );
  }

  if (status === "PENDING_APPEAL") {
    return (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 rounded-sm border border-orange-500 bg-transparent px-4 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
      >
        Hủy kháng cáo
      </button>
    );
  }

  if (status === "PUBLISHED") {
    return (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 rounded-sm border border-slate-500 bg-transparent px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
      >
        Tạm ẩn khóa học
      </button>
    );
  }

  return null;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Chờ duyệt";
    case "PENDING_APPEAL":
      return "Chờ duyệt (Kháng cáo)";
    case "PUBLISHED":
      return "Đã xuất bản";
    case "HIDDEN":
      return "Đang ẩn";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return "Bản nháp";
  }
}
