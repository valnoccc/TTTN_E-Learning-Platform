import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Download,
  Filter,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Users,
  UserRound,
  UserRoundCog,
  X,
} from 'lucide-react';

import AdminLayout from '../../../layouts/AdminLayout';
import {
  useAdminUsers,
  type AdminUserRecord,
  type AdminUserRole,
  type AdminUserStatus,
} from './hooks/useAdminUsers';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getRoleLabel(role: AdminUserRecord['role']) {
  switch (role) {
    case 'ADMIN':
      return 'Quản trị';
    case 'INSTRUCTOR':
      return 'Giảng viên';
    default:
      return 'Học viên';
  }
}

function getRoleClass(role: AdminUserRecord['role']) {
  switch (role) {
    case 'ADMIN':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700'; // Đã đổi từ đen sang Indigo
    case 'INSTRUCTOR':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
}

function getStatusLabel(status: AdminUserStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'Hoạt động';
    case 'INACTIVE':
      return 'Tạm khóa';
    default:
      return 'Đã xóa';
  }
}

function getStatusClass(status: AdminUserStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-500 bg-emerald-500 text-white shadow-sm';
    case 'INACTIVE':
      return 'border-amber-500 bg-amber-500 text-white shadow-sm';
    default:
      return 'border-rose-500 bg-rose-500 text-white shadow-sm';
  }
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        {/* Đổi icon sang tone xanh ngọc sáng */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const {
    users,
    summary,
    loading,
    search,
    setSearch,
    role,
    setRole,
    status,
    setStatus,
    updateUserStatus,
    updateUserRole,
  } = useAdminUsers();

  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [drawerRole, setDrawerRole] = useState<Exclude<AdminUserRole, 'ALL'>>('STUDENT');
  const [drawerStatus, setDrawerStatus] = useState<Exclude<AdminUserStatus, 'ALL'>>('ACTIVE');

  useEffect(() => {
    if (selectedUser && !users.some((user) => user.id === selectedUser.id)) {
      setSelectedUser(null);
    }
  }, [selectedUser, users]);

  useEffect(() => {
    if (selectedUser) {
      setDrawerRole(selectedUser.role);
      setDrawerStatus(selectedUser.status);
    }
  }, [selectedUser]);

  const exportCsv = () => {
    if (users.length === 0) {
      return;
    }

    const escapeCell = (value: string | number | null | undefined) => {
      const nextValue = String(value ?? '');
      return `"${nextValue.replace(/"/g, '""')}"`;
    };

    const rows = [
      [
        'ID',
        'Ho ten',
        'Email',
        'So dien thoai',
        'Vai tro',
        'Trang thai',
        'Ngay tao',
        'So khoa hoc',
        'So luot mua',
        'Tong chi tieu',
      ],
      ...users.map((user) => [
        user.id,
        user.fullName,
        user.email,
        user.phone ?? '',
        getRoleLabel(user.role),
        getStatusLabel(user.status),
        formatDate(user.createdAt),
        user.activeEnrollments,
        user.purchaseCount,
        user.totalSpent,
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveDrawerRole = async () => {
    if (!selectedUser) return;

    const updated = await updateUserRole(selectedUser.id, drawerRole);
    if (updated) {
      setSelectedUser(null);
    }
  };

  const handleSaveDrawerStatus = async () => {
    if (!selectedUser) return;

    const updated = await updateUserStatus(selectedUser.id, drawerStatus);
    if (updated) {
      setSelectedUser(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in relative">
          <div className="absolute inset-y-0 right-0 w-[240px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_72%)] pointer-events-none" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                Quản lý người dùng
              </h1>
            </div>

            {/* Đổi màu Nút Xuất CSV */}
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              <Download size={16} />
              Xuất CSV
            </button>
          </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 relative">
          <StatCard
            label="Tổng tài khoản"
            value={summary.totalUsers.toLocaleString('vi-VN')}
            description="Tất cả người dùng"
            icon={<Users size={20} />}
          />
          <StatCard
            label="Đang hoạt động"
            value={summary.activeUsers.toLocaleString('vi-VN')}
            description="Tài khoản đang mở"
            icon={<ShieldCheck size={20} />}
          />
          <StatCard
            label="Giảng viên"
            value={summary.instructors.toLocaleString('vi-VN')}
            description="Vai trò instructor"
            icon={<UserRoundCog size={20} />}
          />
          <StatCard
            label="Học viên"
            value={summary.students.toLocaleString('vi-VN')}
            description="Vai trò student"
            icon={<UserRound size={20} />}
          />
        </section>

       <section className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm relative">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Ô tìm kiếm chiếm phần lớn không gian còn lại (flex-1) */}
            <label className="relative block flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên, email hoặc số điện thoại..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-[14px] font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            {/* Ô chọn Vai trò (độ rộng cố định trên màn hình to) */}
            <label className="relative block md:w-[200px]">
              <Filter
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as AdminUserRole)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Quản trị</option>
                <option value="INSTRUCTOR">Giảng viên</option>
                <option value="STUDENT">Học viên</option>
              </select>
            </label>

            {/* Ô chọn Trạng thái (độ rộng cố định trên màn hình to) */}
            <label className="relative block md:w-[200px]">
              <Filter
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as AdminUserStatus)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm khóa</option>
                <option value="DELETED">Đã xóa</option>
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm relative">
          {/* Đổi nền Header Bảng thành trắng sáng */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">Danh sách người dùng</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? 'Đang tải dữ liệu...' : `${users.length} tài khoản trong bộ lọc hiện tại`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <UserCog size={28} strokeWidth={1.6} />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-slate-900">
                Không tìm thấy người dùng
              </h3>
              <p className="mt-2 text-[14px] text-slate-500">
                Hãy thử đổi từ khóa tìm kiếm hoặc bộ lọc vai trò/trạng thái.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="w-[34%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Người dùng
                    </th>
                    <th className="w-[14%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Vai trò
                    </th>
                    <th className="w-[12%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Trạng thái
                    </th>
                    <th className="w-[16%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Giao dịch
                    </th>
                    <th className="w-[16%] px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Tổng chi tiêu
                    </th>
                    <th className="w-[14%] px-6 py-4 text-center text-[12px] font-bold uppercase tracking-wider text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100 align-top transition hover:bg-slate-50/70">
                      <td className="px-6 py-5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="flex w-full items-start gap-4 text-left"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-50">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.fullName || 'User'} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-slate-500">
                                {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[14px] font-bold text-slate-900 transition hover:text-emerald-600">
                              {user.fullName}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-slate-500">
                              <Mail size={12} className="text-slate-400" />
                              <span>{user.email}</span>
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-slate-500">
                              <Phone size={12} className="text-slate-400" />
                              <span>{user.phone || 'Chưa cập nhật số điện thoại'}</span>
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-bold ${getRoleClass(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-bold ${getStatusClass(user.status)}`}
                        >
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <p className="text-[13px] font-bold text-slate-900">
                          {user.purchaseCount.toLocaleString('vi-VN')} lượt mua
                        </p>
                        <p className="mt-1 text-[12px] font-medium text-slate-500">
                          {user.activeEnrollments.toLocaleString('vi-VN')} khóa học
                        </p>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <p className="text-[13px] font-bold text-emerald-600">
                          {formatCurrency(user.totalSpent)}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-slate-500">
                          <CalendarDays size={12} className="text-slate-400" />
                          {formatDate(user.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-5 align-middle">
  <div className="flex items-center justify-center gap-2">
    {/* Nút Chi tiết */}
    <button
      onClick={() => setSelectedUser(user)}
      className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600"
    >
      <UserCog size={14} />
      Chi tiết
    </button>
    
    {/* Nút Khóa / Mở */}
    <button
      onClick={() =>
        void updateUserStatus(
          user.id,
          user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        )
      }
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[12px] font-semibold shadow-sm transition ${
        user.status === 'ACTIVE'
          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
      }`}
    >
      {user.status === 'ACTIVE' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
      {user.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
    </button>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm">
          <button
            aria-label="Đóng chi tiết"
            onClick={() => setSelectedUser(null)}
            className="flex-1"
          />

          <aside className="relative flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-white shadow-2xl">
            {/* Đổi nền Drawer Header thành trắng */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Chi tiết người dùng</h2>
                <p className="mt-1 text-sm text-slate-500">Quản lý nhanh trạng thái và vai trò.</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 ring-4 ring-white shadow-sm">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-black text-emerald-700">
                        {selectedUser.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-slate-900">
                      {selectedUser.fullName}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-500">{selectedUser.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${getRoleClass(selectedUser.role)}`}
                      >
                        {getRoleLabel(selectedUser.role)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${getStatusClass(selectedUser.status)}`}
                      >
                        {getStatusLabel(selectedUser.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Lượt mua</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {selectedUser.purchaseCount.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Khóa học</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {selectedUser.activeEnrollments.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-100/50">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600/80">Chi tiêu</p>
                  <p className="mt-2 text-xl font-black text-emerald-700">
                    {formatCurrency(selectedUser.totalSpent)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Ngày tạo</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="text-base font-bold text-slate-900">Cập nhật nhanh</h4>
                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-[13px] font-semibold text-slate-600">Phân quyền Vai trò</span>
                    <select
                      value={drawerRole}
                      onChange={(event) =>
                        setDrawerRole(event.target.value as Exclude<AdminUserRole, 'ALL'>)
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="STUDENT">Học viên</option>
                      <option value="INSTRUCTOR">Giảng viên</option>
                      <option value="ADMIN">Quản trị</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[13px] font-semibold text-slate-600">Trạng thái tài khoản</span>
                    <select
                      value={drawerStatus}
                      onChange={(event) =>
                        setDrawerStatus(event.target.value as Exclude<AdminUserStatus, 'ALL'>)
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="INACTIVE">Tạm khóa</option>
                      <option value="DELETED">Đã xóa</option>
                    </select>
                  </label>

                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => void handleSaveDrawerRole()}
                      disabled={selectedUser.role === drawerRole}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserRoundCog size={16} />
                      Lưu vai trò
                    </button>
                    <button
                      onClick={() => void handleSaveDrawerStatus()}
                      disabled={selectedUser.status === drawerStatus}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShieldCheck size={16} />
                      Lưu trạng thái
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </AdminLayout>
  );
}