import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../../layouts/AdminLayout';
import axiosClient from '../../../api/axios';

type Item = {
  requestId: number;
  instructorName: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  COMPLETED: 'Đã chuyển',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
};

const statusClass: Record<string, string> = {
  PENDING: 'border border-amber-200 bg-amber-50 text-amber-700',
  COMPLETED: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border border-slate-200 bg-slate-100 text-slate-600',
};

export default function AdminWithdrawals() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(
        await axiosClient.get('/admin/withdrawals', {
          params: status === 'ALL' ? {} : { status },
        }),
      );
    } catch {
      toast.error('Không thể tải yêu cầu rút tiền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-600">Tài chính nền tảng</p>
            <h1 className="text-3xl font-black">Yêu cầu rút tiền</h1>
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border bg-white px-4 py-3 text-sm font-bold"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="COMPLETED">Đã chuyển</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-5">Giảng viên</th>
                <th className="p-5">Tài khoản nhận</th>
                <th className="p-5 text-right">Số tiền</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center">Đang tải...</td></tr>
              ) : items.map((item) => (
                <tr key={item.requestId} className="border-t">
                  <td className="p-5 font-bold">{item.instructorName}</td>
                  <td className="p-5">
                    {item.accountHolder}
                    <small className="block text-slate-500">{item.bankName} · {item.accountNumber}</small>
                  </td>
                  <td className="p-5 text-right font-black">{money(item.amount)}</td>
                  <td className="p-5">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[item.status] ?? statusClass.CANCELLED}`}>
                      {statusLabel[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <Link
                      to={`/admin/withdrawals/${item.requestId}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700"
                    >
                      <Eye size={16} />Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
