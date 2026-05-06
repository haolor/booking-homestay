import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { api, formatApiError } from '../../services/api';
import type { Booking, Paginated } from '../../types';

function statusVi(s: string): string {
  const m: Record<string, string> = {
    pending: 'Chờ chủ nhà',
    awaiting_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    checked_in: 'Đã nhận phòng',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
    rejected: 'Từ chối',
  };
  return m[s] ?? s;
}

export function AdminBookings() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [actionErr, setActionErr] = useState('');

  const queryKey = useMemo(() => ['admin', 'bookings', page, status], [page, status]);

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (status) params.set('status', status);
      const res = await api.get<Paginated<Booking>>(`/bookings/?${params}`);
      return res.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const postAction = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) => {
      await api.post(`/bookings/${id}/${path}`, path === 'cancel/' ? { reason: 'admin' } : {});
    },
    onSuccess: () => {
      setActionErr('');
      invalidate();
    },
    onError: (e) => setActionErr(formatApiError(e, 'Thao tác thất bại.')),
  });

  const rows = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Đơn đặt phòng</h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl">
          Xem mọi đơn trên hệ thống. Dùng các thao tác giống chủ nhà: xác nhận, từ chối, check-in, hủy (theo trạng thái hiện tại của backend).
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs text-slate-500 uppercase font-semibold shrink-0">Lọc</label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600/50"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ chủ nhà</option>
          <option value="awaiting_payment">Chờ thanh toán</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="checked_in">Đã nhận phòng</option>
          <option value="cancelled">Đã hủy</option>
          <option value="completed">Hoàn thành</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      {actionErr && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/25 px-4 py-3 text-red-200 text-sm">{actionErr}</div>
      )}

      {isLoading && <div className="rounded-2xl border border-slate-800 bg-slate-900/40 h-64 animate-pulse" />}
      {isError && <p className="text-red-400 text-sm">Không tải được đơn đặt.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Khách</th>
                <th className="px-4 py-3 font-semibold">Homestay</th>
                <th className="px-4 py-3 font-semibold">Ở</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Tổng</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rows.map((b) => (
                <tr key={b.id} className="text-slate-300 hover:bg-slate-800/30 align-top">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium text-xs">{b.guest_name ?? '—'}</div>
                    <div className="text-slate-500 text-xs truncate max-w-[140px]">{b.guest_email ?? ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white text-xs max-w-[160px]">{b.homestay_title ?? '—'}</div>
                    <Link to={`/admin/homestays/${b.homestay}`} className="text-[11px] text-brand-400 hover:text-brand-300">
                      Sửa phòng
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {b.check_in_date} → {b.check_out_date}
                    <div className="text-slate-500">{b.num_guests} khách</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200 whitespace-nowrap">{statusVi(b.status)}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-white text-xs">
                    {new Intl.NumberFormat('vi-VN').format(Number.parseFloat(b.total_price) || 0)} ₫
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {b.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={postAction.isPending}
                            onClick={() => postAction.mutate({ id: b.id, path: 'confirm/' })}
                            className="rounded-lg bg-emerald-900/50 text-emerald-300 text-[11px] font-semibold px-2 py-1 hover:bg-emerald-900/70"
                          >
                            Xác nhận
                          </button>
                          <button
                            type="button"
                            disabled={postAction.isPending}
                            onClick={() => postAction.mutate({ id: b.id, path: 'reject/' })}
                            className="rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold px-2 py-1"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          type="button"
                          disabled={postAction.isPending}
                          onClick={() => postAction.mutate({ id: b.id, path: 'checkin/' })}
                          className="rounded-lg bg-brand-900/40 text-brand-300 text-[11px] font-semibold px-2 py-1"
                        >
                          Check-in
                        </button>
                      )}
                      {['pending', 'awaiting_payment', 'confirmed'].includes(b.status) && (
                        <button
                          type="button"
                          disabled={postAction.isPending}
                          onClick={() => {
                            if (window.confirm('Hủy đơn này?')) postAction.mutate({ id: b.id, path: 'cancel/' });
                          }}
                          className="rounded-lg bg-red-950/50 text-red-300 text-[11px] font-semibold px-2 py-1"
                        >
                          Hủy
                        </button>
                      )}
                      <Link to={`/bookings/${b.id}`} className="rounded-lg border border-slate-600 text-slate-400 text-[11px] px-2 py-1 inline-block">
                        Chi tiết
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="px-4 py-12 text-center text-slate-500 text-sm">Không có đơn.</p>
          )}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg px-3 py-1.5 text-sm bg-slate-800 text-white disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-slate-400 text-sm py-1.5">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg px-3 py-1.5 text-sm bg-slate-800 text-white disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
