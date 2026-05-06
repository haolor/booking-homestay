import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { AdminCustomerRow } from '../../types';

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Chưa có';
  return new Date(value).toLocaleString('vi-VN');
}

export function AdminCustomers() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'locked'>('all');

  const { data: customers, isLoading, isError } = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: async () => {
      const res = await api.get<AdminCustomerRow[]>('/admin/customers/');
      return res.data;
    },
  });

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return (customers ?? []).filter((c) => {
      if (status === 'active' && !c.is_active) return false;
      if (status === 'locked' && c.is_active) return false;
      if (!q) return true;
      const haystack = `${c.full_name} ${c.email} ${c.phone_number ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, keyword, status]);

  const totalBookings = rows.reduce((sum, c) => sum + (c.booking_count ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Customer</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl">
            Theo dõi danh sách khách hàng, trạng thái tài khoản và tần suất đặt phòng để hỗ trợ vận hành.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 min-w-[130px]">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Customers</p>
            <p className="mt-1 text-xl font-bold text-white tabular-nums">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 min-w-[130px]">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Tổng booking</p>
            <p className="mt-1 text-xl font-bold text-white tabular-nums">{totalBookings}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="flex-1 min-w-[220px] rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600/50"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'locked')}
            className="rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600/50"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lần đặt gần nhất</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Số booking</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
                    <p className="mt-2 text-sm text-slate-500">Đang tải danh sách customer...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-300 text-sm">
                    Không tải được danh sách customer.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Không có customer phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 grid place-items-center text-slate-300 font-bold">
                          {c.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{c.full_name || 'Chưa cập nhật tên'}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{c.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="text-slate-300">{c.email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.phone_number || 'Chưa cập nhật số'}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{formatDateTime(c.date_joined)}</td>
                    <td className="px-5 py-4 text-sm text-slate-400">{formatDateTime(c.last_booking_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-white tabular-nums">{c.booking_count ?? 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                          c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Locked'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
