import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import { HomestayCard } from '../components/homestay/HomestayCard';
import { api } from '../services/api';
import type { HomestayListItem } from '../types';

async function fetchHomestaysPreview(): Promise<HomestayListItem[]> {
  const res = await api.get<{ results?: HomestayListItem[] } | HomestayListItem[]>('/homestays/');
  const body = res.data;
  const list = Array.isArray(body) ? body : body.results ?? [];
  return list.slice(0, 6);
}

export function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['homestays', 'home-preview'],
    queryFn: fetchHomestaysPreview,
  });

  const { data: me } = useMe();
  const isHost = me?.role === 'host';
  const items = data ?? [];

  return (
    <>
      <section className="relative overflow-hidden bg-hero-mesh border-b border-stone-100">
        <div className="absolute inset-y-0 right-0 w-1/2 max-w-xl opacity-[0.08] pointer-events-none">
          <div className="absolute top-24 right-0 h-72 w-72 rounded-full bg-brand-600 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 border border-brand-100 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            Trải nghiệm nghỉ dưỡng
          </p>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.35rem] font-bold text-ink tracking-tight leading-[1.1]">
            Homestay chọn kỹ,
            <span className="text-brand-600"> không gian có gu</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-stone-600 leading-relaxed">
            Tìm chỗ nghỉ theo thành phố, xem ảnh thật & vị trí trên bản đồ. Đặt phòng nhanh với luồng MVP theo backend hiện tại.
          </p>
          {/* tìm kiếm */}
          <div className="mt-10 flex flex-wrap gap-4">
            {!isHost && (
              <Link to="/search" className="btn-primary px-8 py-3 rounded-2xl text-base">
                Tìm homestay
              </Link>
            )}
            {/* đăng ký */}
            <Link
              to="/register"
              className="btn-outline px-8 py-3 rounded-2xl text-base border-stone-200"
            >
              Tạo tài khoản
            </Link>
          </div>
          <dl className="mt-14 grid grid-cols-3 gap-6 max-w-lg">
            <div className="rounded-2xl bg-white/75 border border-white/80 px-4 py-3 backdrop-blur shadow-card">
              <dt className="text-xs uppercase tracking-wide text-stone-500 font-semibold">Demo</dt>
              <dd className="text-2xl font-bold text-brand-700 mt-1">6+</dd>
              <dd className="text-xs text-stone-500 mt-0.5">căn mẫu</dd>
            </div>
            <div className="rounded-2xl bg-white/75 border border-white/80 px-4 py-3 backdrop-blur shadow-card">
              <dt className="text-xs uppercase tracking-wide text-stone-500 font-semibold">Thành phố</dt>
              <dd className="text-2xl font-bold text-brand-700 mt-1">3+</dd>
              <dd className="text-xs text-stone-500 mt-0.5">Hà Nội, HCM, Đà Lạt…</dd>
            </div>
            <div className="rounded-2xl bg-white/75 border border-white/80 px-4 py-3 backdrop-blur shadow-card">
              <dt className="text-xs uppercase tracking-wide text-stone-500 font-semibold">Giá min</dt>
              <dd className="text-2xl font-bold text-brand-700 mt-1">đêm</dd>
              <dd className="text-xs text-stone-500 mt-0.5">từ 650k trở lên*</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Được yêu thích gần đây
            </h2>
            <p className="mt-2 text-stone-600 max-w-lg">
              Dữ liệu demo tải trực tiếp từ API ({isLoading ? 'đang kết nối…' : `${items.length} căn hiển thị`}).
            </p>
          </div>
          {/* tìm kiếm */}
          {!isHost && (
            <Link
              to="/search"
              className="text-brand-700 font-semibold hover:text-brand-900 flex items-center gap-1 transition"
            >
              Xem toàn bộ
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>

        {isLoading && (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl bg-stone-200/80 h-72" />
            ))}
          </div>
        )}
        {/* nếu chưa chạy được backend hoặc chưa có dữ liệu nào trong API thì hiển thị thông báo này */}
        {!isLoading && items.length === 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-stone-300 bg-stone-50/80 px-8 py-16 text-center">
            <p className="text-stone-600 font-medium">Chưa có homestay trong API.</p>
            <p className="mt-2 text-sm text-stone-500">
              Chạy <code className="bg-white px-1.5 rounded">python manage.py seed_demo</code> trong thư mục{' '}
              <code className="bg-white px-1.5 rounded">backend</code> rồi tải lại trang.
            </p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {items.map((h) => (
              <HomestayCard key={h.id} h={h} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
