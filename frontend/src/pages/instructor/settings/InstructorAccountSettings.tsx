import { FormEvent } from 'react';
import { Banknote, CheckCircle2, CreditCard, Landmark, Save, ShieldCheck, UserRound } from 'lucide-react';

import InstructorLayout from '../../../layouts/InstructorLayout';
import { useInstructorPaymentSettings } from './hooks/useInstructorPaymentSettings';

const fields = [
    { key: 'SoTaiKhoan', label: 'Số tài khoản', placeholder: 'Nhập số tài khoản nhận thanh toán', icon: CreditCard, type: 'text' },
    { key: 'MaNganHang', label: 'Mã ngân hàng', placeholder: 'Ví dụ: VCB, TCB, ACB', icon: Landmark, type: 'text' },
    { key: 'TenNganHang', label: 'Tên ngân hàng', placeholder: 'Ví dụ: Vietcombank', icon: Banknote, type: 'text' },
    { key: 'TenChuTaiKhoan', label: 'Chủ tài khoản', placeholder: 'Tên đúng như tài khoản ngân hàng', icon: UserRound, type: 'text' },
] as const;

export default function InstructorAccountSettings() {
    const { formData, loading, saving, updateField, saveSettings } = useInstructorPaymentSettings();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void saveSettings();
    };

    return (
        <InstructorLayout>
            <div className="mx-auto w-full max-w-5xl space-y-5">
                <header className="border border-slate-200 bg-white px-6 py-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <CreditCard size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Cài đặt tài khoản</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Thông tin nhận thanh toán</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Cập nhật chính xác thông tin tài khoản để nền tảng đối soát và chuyển doanh thu từ các khóa học.</p>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <Landmark size={20} className="text-emerald-700" />
                            <div>
                                <h2 className="font-bold text-slate-900">Tài khoản ngân hàng</h2>
                                <p className="mt-1 text-sm text-slate-600">Tất cả trường thông tin đều cần khớp với tài khoản thực tế.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">Đang tải thông tin thanh toán...</div>
                        ) : (
                            <>
                                <div className="grid gap-5 md:grid-cols-2">
                                    {fields.map(({ key, label, placeholder, icon: Icon, type }) => (
                                        <label key={key} className="block">
                                            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <Icon size={16} className="text-emerald-700" />
                                                {label} <span className="text-rose-500">*</span>
                                            </span>
                                            <input
                                                required
                                                type={type}
                                                value={formData[key]}
                                                onChange={(event) => updateField(key, event.target.value)}
                                                placeholder={placeholder}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                                            />
                                        </label>
                                    ))}
                                </div>

                                <div className="mt-6 flex gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                                    <ShieldCheck size={20} className="mt-0.5 shrink-0 text-sky-700" />
                                    <p>Thông tin này chỉ được sử dụng cho mục đích đối soát và chi trả doanh thu. Hãy kiểm tra kỹ trước khi lưu để tránh chuyển khoản sai.</p>
                                </div>

                                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={16} className="text-emerald-600" />Dữ liệu được lưu an toàn trong hồ sơ giảng viên</div>
                                    <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                                        <Save size={17} />
                                        {saving ? 'Đang lưu...' : 'Lưu thông tin thanh toán'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </InstructorLayout>
    );
}
