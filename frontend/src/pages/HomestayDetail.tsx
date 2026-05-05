import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAppSelector } from '../store';
import type { HomestayDetail } from '../types';

export function HomestayDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tokens = useAppSelector((s) => s.auth.tokens);
  const qc = useQueryClient();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const { data: h, isLoading } = useQuery({
    queryKey: ['homestay', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<HomestayDetail>(`/homestays/${id}/`);
      return res.data;
    },
  });

  const { data: avail } = useQuery({
    queryKey: ['availability', id, checkIn, checkOut],
    enabled: !!id && !!checkIn && !!checkOut,
    queryFn: async () => {
      const res = await api.get<{ available: boolean }>(`/homestays/${id}/availability/`, {
        params: { check_in: checkIn, check_out: checkOut },
      });
      return res.data.available;
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/bookings/', {
        homestay: id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_guests: guests,
      });
      return res.data as { id: string };
    },
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      navigate(`/bookings/${b.id}`);
    },
  });

  const wishMutation = useMutation({
    mutationFn: async () => {
      await api.post('/homestays/wishlist/', { homestay: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  if (isLoading || !h) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-stone-500 animate-pulse">
        Đang tải chi tiết…
      </div>
    );
  }

  const displayTitle = h.title.replace(/^\[Demo\]\s*/i, '').trim();
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const nights =
    checkInDate && checkOutDate
      ? Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
  const pricePerNight = Number(h.price_per_night) || 0;
  const subtotal = nights > 0 ? pricePerNight * nights : 0;
  const serviceFee = subtotal * 0.05;
  const estimatedTotal = subtotal + serviceFee;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14 grid lg:grid-cols-3 gap-10 lg:gap-12">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 rounded-3xl overflow-hidden shadow-card">
          {(h.images?.length ? h.images : []).map((img) =>
            img.url ? (
              <img key={img.id} src={img.url} alt="" className="w-full h-44 sm:h-56 object-cover" />
            ) : null,
          )}
        </div>
        <header>
          <h1 className="text-3xl font-bold text-ink tracking-tight">{displayTitle}</h1>
          <p className="mt-2 text-stone-600">
            <span className="font-medium text-stone-800">{h.city}</span>
            {' · '}
            {h.address}
          </p>
          <p className="mt-4 text-sm text-stone-500 flex flex-wrap gap-3">
            <span>Tối đa {h.max_guests} khách</span>
            <span>·</span>
            <span>
              {h.num_bedrooms} phòng ngủ · {h.num_bathrooms} WC
            </span>
          </p>
        </header>
        <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{h.description}</p>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-400 mb-4">Tiện nghi</h2>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(h.amenities) ? h.amenities : []).map((a) =>
              typeof a === 'object' && a && 'name' in a ? (
                <span
                  key={(a as { id: string }).id}
                  className="text-sm font-medium bg-brand-50 text-brand-900 border border-brand-100 px-3 py-1.5 rounded-xl"
                >
                  {(a as { name: string }).name}
                </span>
              ) : null,
            )}
          </div>
        </section>
      </div>
      <aside className="lg:sticky lg:top-24 h-fit rounded-3xl border border-stone-200 bg-white p-6 shadow-card space-y-5">
        <div>
          <p className="text-3xl font-bold text-brand-700 tracking-tight">
            {Number(h.price_per_night).toLocaleString('vi-VN')}
            <span className="text-base font-semibold text-stone-400"> ₫</span>
          </p>
          <p className="text-xs font-medium text-stone-400 mt-1 uppercase tracking-wide">Giá mỗi đêm</p>
        </div>
        {tokens && (
          <button
            type="button"
            onClick={() => wishMutation.mutate()}
            className="w-full btn-outline rounded-2xl py-2.5 text-sm border-stone-200"
          >
            Lưu yêu thích
          </button>
        )}
        <label className="block text-sm font-semibold text-ink">
          Check-in
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="input-field mt-2"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Check-out
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="input-field mt-2"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Số khách
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="input-field mt-2"
          />
        </label>
        {checkIn && checkOut && (
          <div className="space-y-2">
            <p className="text-sm font-medium px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
              Còn trống:{' '}
              <span className={avail ? 'text-emerald-700' : 'text-red-600'}>
                {avail === undefined ? '…' : avail ? 'Có' : 'Không'}
              </span>
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 space-y-1">
              <div className="flex items-center justify-between">
                <span>Tiền phòng ({nights} đêm)</span>
                <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phí dịch vụ (5%)</span>
                <span>{serviceFee.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="h-px bg-stone-200 my-1" />
              <div className="flex items-center justify-between font-semibold text-brand-700">
                <span>Tổng thanh toán (ước tính)</span>
                <span>{estimatedTotal.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          </div>
        )}
        {!tokens && (
          <p className="text-sm text-stone-600">
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Đăng nhập
            </Link>{' '}
            để đặt phòng và lưu yêu thích.
          </p>
        )}
        {tokens && (
          <button
            type="button"
            disabled={!checkIn || !checkOut || avail === false || bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
            className="btn-primary w-full rounded-2xl py-3"
          >
            {bookMutation.isPending ? 'Đang xử lý…' : 'Đặt phòng'}
          </button>
        )}
      </aside>
    </div>
  );
}
