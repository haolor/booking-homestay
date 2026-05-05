import { Link } from 'react-router-dom';
import type { HomestayListItem } from '../../types';

function typeLabel(type: string) {
  switch (type) {
    case 'entire_house':
      return 'Cả căn';
    case 'private_room':
      return 'Phòng riêng';
    case 'shared_room':
      return 'Phòng chia sẻ';
    default:
      return type;
  }
}

export function HomestayCard({ h }: { h: HomestayListItem }) {
  const rating = Number.parseFloat(String(h.avg_rating)) || 0;

  return (
    <Link
      to={`/homestays/${h.id}`}
      className="group flex flex-col rounded-3xl border border-stone-100 bg-white shadow-card overflow-hidden hover:shadow-soft hover:border-brand-200/60 transition duration-300"
    >
      <div className="aspect-[16/10] bg-stone-200 relative isolate">
        {h.cover_url ? (
          <img
            src={h.cover_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm font-medium bg-stone-100">
            Chưa có ảnh
          </div>
        )}
        <div className="absolute inset-x-0 top-3 flex justify-between px-3 pointer-events-none">
          <span className="rounded-full bg-black/55 text-white text-[11px] font-semibold backdrop-blur-sm px-2.5 py-1 shadow">
            {typeLabel(h.type)}
          </span>
          <span className="rounded-full bg-white/90 text-stone-800 text-xs font-bold px-2.5 py-1 shadow backdrop-blur">
            {h.max_guests} khách tối đa
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <p className="font-semibold text-ink leading-snug line-clamp-2 group-hover:text-brand-800 transition">
          {h.title.replace(/^\[Demo\]\s*/i, '').trim()}
        </p>
        <p className="mt-1.5 text-sm text-stone-500">
          {h.city}
          {h.district ? ` · ${h.district}` : ''}
        </p>
        <div className="mt-4 mt-auto pt-4 border-t border-stone-100 flex items-end justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-brand-700">
              {Number(h.price_per_night).toLocaleString('vi-VN')}
              <span className="text-stone-500 text-sm font-medium"> ₫</span>
            </span>
            <span className="block text-[11px] text-stone-400 font-medium">/đêm · đã gồm phí MVP</span>
          </div>
          <span className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-amber-800 text-sm font-bold tabular-nums border border-amber-100">
            ★ {rating.toFixed(rating % 1 ? 2 : 1)}
          </span>
        </div>
      </div>
    </Link>
  );
}
