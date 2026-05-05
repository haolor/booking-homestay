import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatApiError } from '../services/api';
import { useMe } from '../hooks/useMe';
import { useAppSelector } from '../store';
import type { Booking } from '../types';

export function BookingDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const me = useAppSelector((s) => s.auth.tokens);
  const { data: meProfile } = useMe();
  const [actionError, setActionError] = useState('');

  const { data: b, isLoading } = useQuery({
    queryKey: ['booking', id],
    enabled: !!id && !!me,
    queryFn: async () => {
      const res = await api.get<Booking>(`/bookings/${id}/`);
      return res.data;
    },
  });

  const confirm = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/confirm/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', id] }),
  });
  const reject = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/reject/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', id] }),
  });
  const pay = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ redirect_url: string }>('/payments/create/', {
        booking_id: id,
        method: 'vnpay',
      });
      return res.data.redirect_url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (e) => setActionError(formatApiError(e, 'Không tạo được link thanh toán VNPay.')),
  });
  const cancel = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/cancel/`, { reason: 'guest' }),
    onSuccess: () => {
      setActionError('');
      qc.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: (e) => setActionError(formatApiError(e, 'Không hủy được booking.')),
  });

  if (!me) {
    return (
      <div className="p-8 text-center">
        <Link to="/login" className="text-brand-600">
          Đăng nhập
        </Link>
      </div>
    );
  }
  if (isLoading || !b) {
    return <div className="p-8 text-center text-slate-500">Đang tải…</div>;
  }

  const isHostOrAdmin = meProfile?.role === 'host' || meProfile?.role === 'admin';
  const canGuestCancel = Boolean(
    b.can_cancel_until &&
      b.status !== 'cancelled' &&
      b.status !== 'completed' &&
      b.status !== 'rejected' &&
      new Date(b.can_cancel_until).getTime() > Date.now(),
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Đặt phòng</h1>
      <p className="text-slate-600">{b.homestay_title}</p>
      <p className="text-sm">
        Trạng thái: <span className="font-medium">{b.status}</span>
      </p>
      <p className="text-sm">
        {b.check_in_date} → {b.check_out_date} · {b.num_guests} khách
      </p>
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-stone-700">
          <span>
            Tiền phòng ({b.num_nights} đêm x {Number(b.price_per_night).toLocaleString('vi-VN')} ₫)
          </span>
          <span>{Number(b.subtotal).toLocaleString('vi-VN')} ₫</span>
        </div>
        <div className="flex items-center justify-between text-stone-700">
          <span>Phí dịch vụ (5%)</span>
          <span>{Number(b.service_fee).toLocaleString('vi-VN')} ₫</span>
        </div>
        <div className="h-px bg-stone-200 my-1" />
        <div className="flex items-center justify-between font-semibold text-brand-700 text-base">
          <span>Tổng thanh toán</span>
          <span>{Number(b.total_price).toLocaleString('vi-VN')} ₫</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {isHostOrAdmin && (
          <>
            <button
              type="button"
              onClick={() => confirm.mutate()}
              className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm disabled:opacity-50"
              disabled={b.status !== 'pending' || confirm.isPending}
            >
              Host: Xác nhận
            </button>
            <button
              type="button"
              onClick={() => reject.mutate()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
              disabled={b.status !== 'pending' || reject.isPending}
            >
              Host: Từ chối
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => pay.mutate()}
          className="rounded-md bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          disabled={b.status !== 'awaiting_payment' || pay.isPending}
        >
          Thanh toán VNPay
        </button>
        <button
          type="button"
          onClick={() => cancel.mutate()}
          className="rounded-md border border-red-200 text-red-700 px-4 py-2 text-sm disabled:opacity-50"
          disabled={!canGuestCancel || cancel.isPending}
        >
          Hủy đặt phòng
        </button>
      </div>
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      <p className="text-xs text-slate-500">
        Bạn có thể hủy trong 30 phút từ lúc đặt phòng. Nếu phòng còn trống, bạn có thể thanh toán ngay.
      </p>
    </div>
  );
}
