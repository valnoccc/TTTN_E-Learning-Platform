import type { ReactNode } from 'react';
import {
    ChevronDown,
    Code,
    DollarSign,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    UploadCloud,
} from 'lucide-react';

import {
    CourseSectionCard,
    CourseSidebarCard,
    useInstructorCourseContext,
} from '../CourseDetailShell';

export default function InstructorCourseOverview() {
    const {
        isLocked,
        formData,
        errorText,
        imagePreview,
        handleChange,
        handleImageChange,
        handleImagePickerOpen,
    } = useInstructorCourseContext();

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
            <div className="space-y-5">
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
                                disabled={isLocked}
                                placeholder="Nhập tên khóa học"
                                className={`w-full rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 ${isLocked ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''
                                    }`}
                            />
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
                                    rows={12}
                                    placeholder="Viết mô tả chi tiết cho khóa học của bạn..."
                                    className={`w-full resize-none bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none ${isLocked ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                </CourseSectionCard>

                <CourseSectionCard
                    title="Ảnh bìa khóa học"
                >
                    <input
                        id="course-image-input"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />

                    {imagePreview || formData.hinh_anh ? (
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
                                <img
                                    src={imagePreview || formData.hinh_anh}
                                    alt="Course preview"
                                    className="aspect-[21/12] w-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                </p>
                                <button
                                    onClick={handleImagePickerOpen}
                                    disabled={isLocked}
                                    className={`inline-flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${isLocked ? 'cursor-not-allowed opacity-50' : ''
                                        }`}
                                >
                                    <UploadCloud size={16} />
                                    Thay đổi ảnh
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleImagePickerOpen}
                            disabled={isLocked}
                            className={`flex min-h-[260px] w-full flex-col items-center justify-center rounded-sm border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/40 ${isLocked ? 'cursor-not-allowed opacity-60' : ''
                                }`}
                        >
                            <ImageIcon className="mb-4 text-emerald-600" size={30} />
                            <p className="text-sm font-semibold text-slate-800">
                                Nhấn để tải ảnh khóa học lên
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Định dạng hỗ trợ: JPG, PNG. Tối đa 5MB.
                            </p>
                        </button>
                    )}
                </CourseSectionCard>
            </div>

            <div className="space-y-5">
                <CourseSidebarCard title="Thiết lập">
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

                    <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Danh mục
                        </label>
                        <div className="relative">
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full appearance-none rounded-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 ${isLocked ? 'cursor-not-allowed bg-slate-50 text-slate-400' : ''
                                    }`}
                            >
                                <option>Web Development</option>
                                <option>Data Science</option>
                            </select>
                            <ChevronDown
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                            />
                        </div>
                    </div>
                </CourseSidebarCard>
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
