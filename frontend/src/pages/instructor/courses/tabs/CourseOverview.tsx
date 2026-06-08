import { type ReactNode } from 'react';
import {
    ChevronDown,
    Code,
    DollarSign,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    Plus,
    Trash2,
} from 'lucide-react';

import {
    CourseSectionCard,
    CourseSidebarCard,
    useInstructorCourseContext,
} from '../CourseDetailShell';
import { useCourseCategories } from '../hooks/useCourseCategories';

export default function InstructorCourseOverview() {
    // UI lấy trực tiếp state formData và các action sửa/xóa từ Hook thông qua Context
    const {
        isNewCourse,
        isLocked,
        formData,
        errorText,
        imagePreview,
        handleChange,
        handleImageChange,
        handleImagePickerOpen,
        updateObjective,
        removeObjective,
        addObjective,
        updateRequirement,
        removeRequirement,
        addRequirement
    } = useInstructorCourseContext();
    const { categories, isLoading } = useCourseCategories();

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            <div className="space-y-5">
                {/* 1. THÔNG TIN CƠ BẢN */}
                <CourseSectionCard
                    title="Thông tin cơ bản"
                    description="Điền nội dung hiển thị cho học viên trên trang giới thiệu khóa học."
                >
                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Tên khóa học <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                maxLength={60}
                                disabled={isLocked}
                                placeholder="Nhập tên khóa học"
                                className={`w-full rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 ${isLocked ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''
                                    }`}
                            />
                            {isNewCourse ? (
                                <p className="mt-2 text-xs text-slate-400">
                                    Còn lại {60 - Math.min(formData.title?.length || 0, 60)} ký tự.
                                </p>
                            ) : (
                                <p className="mt-2 text-xs text-slate-400">Tối đa 60 ký tự.</p>
                            )}
                            {errorText ? (
                                <p className="mt-2 text-sm text-red-500">{errorText}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Mô tả khóa học
                            </label>
                            <div
                                className={`overflow-hidden rounded-sm border border-slate-200 ${isLocked ? 'opacity-70' : ''
                                    }`}
                            >
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-slate-400">
                                    <ToolbarIcon icon="B" />
                                    <ToolbarIcon icon={<Italic size={15} />} />
                                    <ToolbarIcon icon={<List size={15} />} />
                                    <ToolbarIcon icon={<LinkIcon size={15} />} />
                                    <ToolbarIcon icon={<Code size={15} />} />
                                </div>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    disabled={isLocked}
                                    rows={8}
                                    placeholder="Viết mô tả chi tiết cho khóa học của bạn..."
                                    className={`w-full resize-none bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none ${isLocked ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                </CourseSectionCard>

                {/* 2. MỤC TIÊU KHÓA HỌC */}
                <CourseSectionCard
                    title="Học viên sẽ học được gì trong khóa học của bạn?"
                    description="Bạn phải nhập ít nhất 4 mục tiêu hoặc kết quả học tập mà học viên có thể mong đợi đạt được sau khi hoàn thành khóa học."
                >
                    <div className="space-y-3">
                        {(formData.muc_tieu || []).map((obj, index) => (
                            <div key={`obj-${index}`} className="group flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        value={obj}
                                        onChange={(e) => updateObjective(index, e.target.value)}
                                        maxLength={160}
                                        disabled={isLocked}
                                        placeholder="Ví dụ: Xác định vai trò và trách nhiệm của người quản lý dự án"
                                        className={`w-full rounded-sm border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm text-slate-800 outline-none transition focus:border-emerald-500 ${isLocked ? 'cursor-not-allowed bg-slate-50' : ''}`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                        {160 - obj.length}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeObjective(index)}
                                    disabled={isLocked || formData.muc_tieu.length <= 1}
                                    className="p-2 text-slate-300 transition hover:text-red-500 disabled:opacity-30"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addObjective}
                            disabled={isLocked}
                            className="flex items-center gap-2 pt-2 text-sm font-semibold text-violet-700 transition hover:text-violet-800"
                        >
                            <Plus size={16} /> Thêm nội dung vào phản hồi của bạn
                        </button>
                    </div>
                </CourseSectionCard>

                {/* 3. YÊU CẦU KHÓA HỌC */}
                <CourseSectionCard
                    title="Yêu cầu hoặc điều kiện tiên quyết để tham gia khóa học của bạn là gì?"
                    description="Liệt kê các kỹ năng, kinh nghiệm, công cụ hoặc thiết bị mà học viên bắt buộc phải có trước khi tham gia. Nếu bạn không có yêu cầu nào, hãy coi đây là cơ hội để bạn hạ thấp tiêu chuẩn cho người mới bắt đầu."
                >
                    <div className="space-y-3">
                        {(formData.yeu_cau || []).map((req, index) => (
                            <div key={`req-${index}`} className="group flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        value={req}
                                        onChange={(e) => updateRequirement(index, e.target.value)}
                                        maxLength={160}
                                        disabled={isLocked}
                                        placeholder="Ví dụ: Không cần kinh nghiệm lập trình. Bạn sẽ học mọi thứ mà bạn cần biết"
                                        className={`w-full rounded-sm border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm text-slate-800 outline-none transition focus:border-emerald-500 ${isLocked ? 'cursor-not-allowed bg-slate-50' : ''}`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                        {160 - req.length}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeRequirement(index)}
                                    disabled={isLocked || formData.yeu_cau.length <= 1}
                                    className="p-2 text-slate-300 transition hover:text-red-500 disabled:opacity-30"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addRequirement}
                            disabled={isLocked}
                            className="flex items-center gap-2 pt-2 text-sm font-semibold text-violet-700 transition hover:text-violet-800"
                        >
                            <Plus size={16} /> Thêm nội dung vào phản hồi của bạn
                        </button>
                    </div>
                </CourseSectionCard>
            </div>

            {/* SIDEBAR BÊN PHẢI */}
            <div className="space-y-5">
                <CourseSidebarCard title="Thiết lập">
                    <div className="space-y-5">
                        {/* Giá */}
                        <div>
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Giá khóa học
                            </label>
                            <div className="relative">
                                <DollarSign
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
                                    size={16}
                                />
                                <input
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    disabled={isLocked}
                                    className={`w-full rounded-sm border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 ${isLocked ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Danh mục */}
                        <div>
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Danh mục
                            </label>
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    disabled={isLocked || isLoading}
                                    className={`w-full appearance-none rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 ${isLocked || isLoading ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''
                                        }`}
                                >
                                    {isLoading ? (
                                        <option value="">Đang tải danh mục...</option>
                                    ) : (
                                        <option value="">-- Chọn danh mục khóa học --</option>
                                    )}

                                    {/* ĐỔI THÀNH DỮ LIỆU ĐỘNG TỪ DB */}
                                    {!isLoading && categories.map((cat) => (
                                        <option key={cat.maDM} value={cat.maDM}>
                                            {cat.tenDM}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={16}
                                />
                            </div>
                        </div>

                        {/* Ảnh bìa khóa học */}
                        <div className="pt-2">
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Ảnh bìa khóa học
                            </label>
                            <input
                                id="course-image-input"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />

                            <div
                                onClick={!isLocked ? handleImagePickerOpen : undefined}
                                className={`group relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-slate-200 bg-slate-50 transition ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-emerald-500'
                                    }`}
                            >
                                {imagePreview || formData.hinh_anh ? (
                                    <>
                                        <img
                                            src={imagePreview || formData.hinh_anh}
                                            alt="Course Cover"
                                            className="h-full w-full object-cover transition-all duration-300 group-hover:blur-[2px]"
                                        />
                                        {!isLocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                                <span className="flex items-center gap-2 rounded-sm bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">
                                                    <ImageIcon size={14} /> Thay đổi ảnh
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-slate-400 transition group-hover:text-emerald-500">
                                        <ImageIcon size={26} className="mb-2" />
                                        <p className="text-xs font-medium">Nhấn để chọn ảnh</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CourseSidebarCard> {/* Đóng CourseSidebarCard chuẩn cấu trúc phân cấp */}
            </div>
        </div>
    );
}

function ToolbarIcon({ icon }: { icon: ReactNode }) {
    return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 bg-white text-sm font-semibold text-slate-500">
            {icon}
        </span>
    );
}
