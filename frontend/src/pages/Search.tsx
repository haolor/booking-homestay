import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import { HomestayCard } from '../components/homestay/HomestayCard';
import { api } from '../services/api';
import type { HomestayListItem } from '../types';

export function Search() {
  const [city, setCity] = useState('');
  const { data: me } = useMe();
  const navigate = useNavigate();

  useEffect(() => {
    if (me?.role === 'host') {
      navigate('/', { replace: true });
    }
  }, [me, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['homestays', city],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (city.trim()) params.city = city.trim();
      const res = await api.get<{ results?: HomestayListItem[] } | HomestayListItem[]>(
        '/homestays/',
        { params },
      );
      const body = res.data;
      return Array.isArray(body) ? body : body.results ?? [];
    },
  });

  const items = useMemo(() => data ?? [], [data]);
  const groupedByCity = useMemo(() => {
    const map = new Map<string, HomestayListItem[]>();
    for (const h of items) {
      const key = h.city?.trim() || 'Khác';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'));
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="rounded-3xl border border-stone-100 bg-gradient-to-br from-white to-brand-50/40 px-6 py-10 sm:p-10 shadow-card">
        <h1 className="text-3xl font-bold text-ink tracking-tight">Tìm homestay phù hợp</h1>
        <p className="mt-3 text-stone-600 max-w-2xl">
          Lọc theo thành phố, ghép với bản đồ để hình dung khu vực. Dữ liệu lấy từ REST API của dự án.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 items-end">
          <label className="flex flex-col min-w-[200px] flex-1 sm:flex-none">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
              Thành phố / tỉnh
            </span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ví dụ: Hà Nội, Đà Lạt"
              className="input-field rounded-2xl"
            />
          </label>
          <button
            type="button"
            className="btn-outline rounded-2xl py-3"
            onClick={() => setCity('')}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {isLoading && <p className="mt-10 text-center text-stone-500 animate-pulse">Đang tải danh sách…</p>}
      {error && (
        <div className="mt-10 rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-red-800 text-center text-sm font-medium">
          Không kết nối được API. Kiểm tra backend <code className="font-mono">runserver</code> trên cổng 8000.
        </div>
      )}

      <div className="mt-12">
        {!isLoading && !error && items.length === 0 && (
          <p className="text-stone-500 text-center py-12">Không có homestay với điều kiện đã chọn.</p>
        )}
        <div className="space-y-8">
          {groupedByCity.map(([cityName, cityItems]) => (
            <section key={cityName} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Khu vực {cityName}</h2>
                <span className="text-xs font-medium text-stone-500">
                  {cityItems.length} homestay
                </span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 content-start">
                {cityItems.map((h) => (
                  <HomestayCard key={h.id} h={h} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
