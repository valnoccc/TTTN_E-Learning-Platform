import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Camera, Image, Save, User } from 'lucide-react';

import InstructorLayout from '../../../layouts/InstructorLayout';
import { useInstructorProfile } from './hooks/useInstructorProfile';

type StoredInstructorUser = {
    fullName?: string;
    AnhDaiDien?: string;
    avatar?: string;
};

export default function InstructorProfile() {
    const { formData, handleChange, handleSave } = useInstructorProfile();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const storedUser = useMemo<StoredInstructorUser>(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null') || {};
        } catch {
            return {};
        }
    }, []);

    const [currentName, setCurrentName] = useState(storedUser.fullName || '');
    const [avatarUrl, setAvatarUrl] = useState(storedUser.AnhDaiDien || storedUser.avatar || '');

    const avatarPreview = avatarUrl.trim();
    const instructorInitial = (currentName || storedUser.fullName || 'G').charAt(0).toUpperCase();

    const handleUserFieldChange =
        (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
            setter(event.target.value);
        };

    const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setAvatarUrl(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        const nextUser = {
            ...storedUser,
            fullName: currentName,
            AnhDaiDien: avatarUrl,
            avatar: avatarUrl,
        };

        localStorage.setItem('user', JSON.stringify(nextUser));
        await handleSave();
    };

    return (
        <InstructorLayout>
            <div className="mx-auto w-full max-w-5xl space-y-5">
                <div className="border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                            <User size={20} className="text-emerald-700" />
                            Hồ sơ chuyên môn giảng viên
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Cập nhật thông tin hiển thị, mô tả chuyên môn và các liên kết cá nhân của bạn.
                        </p>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                        <section className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
                            <div className="space-y-4">
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                                    Thông tin hiển thị
                                </div>

                                <div className="border border-slate-200 bg-white p-4">
                                    <div className="flex flex-col items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => avatarInputRef.current?.click()}
                                            // Thay h-28 w-28 thành h-40 w-40 (hoặc kích thước bạn muốn)
                                            className="group relative block h-40 w-40 overflow-hidden border-2 border-slate-300 bg-white text-left shadow-sm"
                                        >
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="Ảnh đại diện giảng viên"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                // Tăng font-size cho chữ cái đầu
                                                <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-5xl font-bold text-emerald-700">
                                                    {instructorInitial}
                                                </div>
                                            )}

                                            {/* Phần phủ khi hover */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/55">
                                                <span className="inline-flex items-center gap-2 border border-white/70 bg-slate-900/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white opacity-0 transition group-hover:opacity-100">
                                                    <Camera size={16} />
                                                    Đổi ảnh
                                                </span>
                                            </div>
                                        </button>

                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarFileChange}
                                            className="hidden"
                                        />

                                        <div className="w-full text-center">
                                            <div className="text-lg font-bold text-slate-900">
                                                {currentName.trim() || 'Giảng viên'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="p-6">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="border-b border-slate-200 pb-2">
                                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-600">
                                            Hồ sơ cá nhân
                                        </h2>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Tên hiển thị</label>
                                            <input
                                                value={currentName}
                                                onChange={handleUserFieldChange(setCurrentName)}
                                                placeholder="Nhập họ và tên hiển thị"
                                                className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-700"
                                            />
                                        </div>

                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="border-b border-slate-200 pb-2">
                                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-600">
                                            Thông tin chuyên môn
                                        </h2>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-1">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Chuyên môn</label>
                                            <input
                                                name="ChuyenMon"
                                                value={formData.ChuyenMon}
                                                onChange={handleChange}
                                                placeholder="Ví dụ: React, Node.js, Machine Learning"
                                                // THAY ĐỔI Ở ĐÂY:
                                                className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700"
                                            />
                                        </div>

                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Tiểu sử</label>
                                        <textarea
                                            name="TieuSu"
                                            value={formData.TieuSu}
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="Giới thiệu kinh nghiệm giảng dạy, định hướng chuyên môn và thành tựu nổi bật."
                                            className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="border-b border-slate-200 pb-2">
                                        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-600">
                                            Liên kết cá nhân
                                        </h2>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Facebook URL</label>
                                            <input
                                                name="FacebookURL"
                                                value={formData.FacebookURL}
                                                onChange={handleChange}
                                                placeholder="https://facebook.com/your-profile"
                                                className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-700"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Instagram URL</label>
                                            <input
                                                name="InstagramURL"
                                                value={formData.InstagramURL}
                                                onChange={handleChange}
                                                placeholder="https://instagram.com/your-profile"
                                                className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-700"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">GitHub URL</label>
                                            <input
                                                name="GitHubURL"
                                                value={formData.GitHubURL}
                                                onChange={handleChange}
                                                placeholder="https://github.com/your-account"
                                                className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-700"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Website URL</label>
                                            <input
                                                name="WebsiteURL"
                                                value={formData.WebsiteURL}
                                                onChange={handleChange}
                                                placeholder="https://your-website.com"
                                                className="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4 text-right">
                                    <button
                                        type="button"
                                        onClick={() => void handleSubmit()}
                                        className="inline-flex items-center gap-2 border border-emerald-700 bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                                    >
                                        <Save size={17} />
                                        Lưu hồ sơ
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
}
