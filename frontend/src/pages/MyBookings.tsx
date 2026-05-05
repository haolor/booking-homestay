import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAppSelector } from '../store';
import type { Booking, Paginated } from '../types';

function statusVi(status: string): string {
  const map: Record<string, string> = {
    pending: 'Chờ chủ nhà',
    awaiting_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
    rejected: 'Từ chối',
  };
  return map[status] ?? status;
}

export function MyBookings() {
  const tokens = useAppSelector((s) => s.auth.tokens);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-bookings'],
    enabled: !!tokens,
    queryFn: async () => {
      const res = await api.get<Paginated<Booking>>('/bookings/');
      return res.data;
    },
  });

  if (!tokens) return <Navigate to="/login" replace />;

  const rows = data?.results ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Phòng đã đặt</h1>
        <p className="text-sm text-stone-500 mt-1">Theo dõi các booking và vào trang chi tiết để thanh toán hoặc hủy.</p>
      </div>

      {isLoading && <div className="rounded-2xl border border-stone-200 h-40 animate-pulse" />}
      {isError && <p className="text-sm text-red-600">Không tải được danh sách đặt phòng.</p>}

      {!isLoading && !isError && (
        <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500 uppercase text-xs tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Homestay</th>
                <th className="px-4 py-3 text-left font-semibold">Lịch ở</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold">Tổng</th>
                <th className="px-4 py-3 text-right font-semibold">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-ink font-medium">{b.homestay_title ?? 'Homestay'}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {b.check_in_date} → {b.check_out_date}
                    <div className="text-xs text-stone-400">{b.num_guests} khách</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-stone-100 text-stone-700 px-2 py-1 text-xs">{statusVi(b.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-700 font-semibold">
                    {Number(b.total_price).toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/bookings/${b.id}`} className="text-sm text-brand-700 hover:underline font-semibold">
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-4 py-10 text-center text-stone-500">Bạn chưa có booking nào.</p>}
        </div>
      )}
    </div>
  );
}
