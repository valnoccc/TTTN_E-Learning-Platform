import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Award, BriefcaseBusiness, Camera, Image, Plus, Save, Trash2, User } from 'lucide-react';

import InstructorLayout from '../../../layouts/InstructorLayout';
import { useInstructorProfile } from './hooks/useInstructorProfile';


type StoredInstructorUser = {
    fullName?: string;
    AnhDaiDien?: string;
    avatar?: string;
};

export default function InstructorProfile() {
    const {
        formData,
        handleChange,
        handleSave,
        initialUser,
        updateBangCap,
        updateKinhNghiem,
        addBangCap,
        removeBangCap,
        addKinhNghiem,
        removeKinhNghiem,
    } = useInstructorProfile();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [currentName, setCurrentName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // THÊM: State tạm thời để lưu trữ đối tượng File ảnh khi người dùng chọn
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [editingBangCap, setEditingBangCap] = useState<number | null>(null);
    const [editingKinhNghiem, setEditingKinhNghiem] = useState<number | null>(null);

    const handleAddBangCap = () => {
        setEditingBangCap(formData.BangCaps.length);
        addBangCap();
    };

    const handleAddKinhNghiem = () => {
        setEditingKinhNghiem(formData.KinhNghiems.length);
        addKinhNghiem();
    };

    useEffect(() => {
        if (initialUser.hoTen || initialUser.anhDaiDien) {
            setCurrentName(initialUser.hoTen);
            setAvatarUrl(initialUser.anhDaiDien);
        }
    }, [initialUser]);

    const avatarPreview = avatarUrl.trim();
    const instructorInitial = (currentName || 'G').charAt(0).toUpperCase();

    const handleUserFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
        (e: ChangeEvent<HTMLInputElement>) => {
            setter(e.target.value);
        };

    // THAY ĐỔI: Khi chọn file, chỉ tạo link xem trước chứ CHƯA UPLOAD
    const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file); // Giữ lại file để khi nhấn "Lưu" mới gửi đi

        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl); // Hiển thị ảnh xem trước tạm thời trên UI
    };

    // THAY ĐỔI: Gửi kèm cả File ảnh (nếu có) khi nhấn nút Lưu hồ sơ
    const handleSubmit = async () => {
        await handleSave(currentName, avatarUrl, selectedFile);
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
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-600">
                                            <Award size={18} className="text-emerald-700" /> Bằng cấp
                                        </h2>
                                        <button type="button" onClick={handleAddBangCap} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100">
                                            <Plus size={15} /> Thêm bằng cấp
                                        </button>
                                    </div>

                                    {formData.BangCaps.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">Chưa có bằng cấp. Hãy thêm thông tin học vấn để học viên hiểu rõ chuyên môn của bạn.</div>
                                    ) : formData.BangCaps.map((item, index) => (
                                        <div key={item.MaBangCap || index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-800">Bằng cấp {index + 1}</span>
                                                <div className="flex items-center">
                                                    {item.MaBangCap && editingBangCap !== index && <button type="button" onClick={() => setEditingBangCap(index)} className="mr-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800">Sửa</button>}
                                                    <button type="button" onClick={() => removeBangCap(index)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"><Trash2 size={14} /> Xóa</button>
                                                </div>
                                            </div>
                                            {editingBangCap === index || !item.MaBangCap ? (
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Tên trường *</span><input required value={item.TenTruong} onChange={(event) => updateBangCap(index, 'TenTruong', event.target.value)} placeholder="Ví dụ: Đại học Bách Khoa" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Tên bằng cấp *</span><input required value={item.TenBangCap} onChange={(event) => updateBangCap(index, 'TenBangCap', event.target.value)} placeholder="Ví dụ: Cử nhân Công nghệ thông tin" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Chuyên ngành</span><input value={item.ChuyenNganh} onChange={(event) => updateBangCap(index, 'ChuyenNganh', event.target.value)} placeholder="Ví dụ: Khoa học máy tính" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                                <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Từ năm</span><input type="number" min={1900} max={2200} value={item.NamBatDau} onChange={(event) => updateBangCap(index, 'NamBatDau', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Đến năm</span><input type="number" min={1900} max={2200} value={item.NamKetThuc} onChange={(event) => updateBangCap(index, 'NamKetThuc', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label></div>
                                            </div>
                                            ) : (
                                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                                                    <span className="font-semibold text-slate-900">{item.TenBangCap || 'Chưa nhập tên bằng cấp'}</span>
                                                    <span>{item.TenTruong}</span>
                                                    {item.ChuyenNganh && <span>{item.ChuyenNganh}</span>}
                                                    {(item.NamBatDau || item.NamKetThuc) && <span>{item.NamBatDau || '—'} – {item.NamKetThuc || 'nay'}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-600">
                                            <BriefcaseBusiness size={18} className="text-emerald-700" /> Kinh nghiệm
                                        </h2>
                                        <button type="button" onClick={handleAddKinhNghiem} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100">
                                            <Plus size={15} /> Thêm kinh nghiệm
                                        </button>
                                    </div>

                                    {formData.KinhNghiems.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">Chưa có kinh nghiệm. Hãy liệt kê các vị trí hoặc đơn vị bạn từng làm việc.</div>
                                    ) : formData.KinhNghiems.map((item, index) => (
                                        <div key={item.MaKinhNghiem || index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                            <div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold text-slate-800">Kinh nghiệm {index + 1}</span><div className="flex items-center"><button type="button" onClick={() => setEditingKinhNghiem(index)} className="mr-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800">Sửa</button><button type="button" onClick={() => removeKinhNghiem(index)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"><Trash2 size={14} /> Xóa</button></div></div>
                                            {editingKinhNghiem === index || !item.MaKinhNghiem ? (
                                            <div className="space-y-3">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Đơn vị *</span><input required value={item.TenDonVi} onChange={(event) => updateKinhNghiem(index, 'TenDonVi', event.target.value)} placeholder="Ví dụ: Edumeo" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Chức vụ *</span><input required value={item.ChucVu} onChange={(event) => updateKinhNghiem(index, 'ChucVu', event.target.value)} placeholder="Ví dụ: Technical Lead" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Từ năm</span><input type="number" min={1900} max={2200} value={item.NamBatDau} onChange={(event) => updateKinhNghiem(index, 'NamBatDau', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Đến năm</span><input type="number" min={1900} max={2200} disabled={item.DangLamViec} value={item.NamKetThuc} onChange={(event) => updateKinhNghiem(index, 'NamKetThuc', event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                            </div>
                                            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={item.DangLamViec} onChange={(event) => updateKinhNghiem(index, 'DangLamViec', event.target.checked)} /> Đang làm việc tại đây</label>
                                            <label className="mt-3 block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Mô tả</span><textarea rows={3} maxLength={500} value={item.MoTa} onChange={(event) => updateKinhNghiem(index, 'MoTa', event.target.value)} placeholder="Mô tả ngắn về vai trò hoặc thành tựu..." className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
                                            </div>
                                            ) : (
                                                <div className="space-y-2 text-sm text-slate-600">
                                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2"><span className="font-semibold text-slate-900">{item.ChucVu || 'Chưa nhập chức vụ'}</span><span>{item.TenDonVi}</span><span>{item.NamBatDau || '—'} – {item.DangLamViec ? 'nay' : item.NamKetThuc || '—'}</span></div>
                                                    {item.MoTa && <p className="line-clamp-2 text-slate-500">{item.MoTa}</p>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
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
