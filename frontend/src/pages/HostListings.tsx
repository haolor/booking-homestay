import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { HomestayCard } from '../components/homestay/HomestayCard';
import { api, formatApiError } from '../services/api';
import { useAppSelector } from '../store';
import type { HomestayListItem } from '../types';

export function HostListings() {
  const tokens = useAppSelector((s) => s.auth.tokens);
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Hà Nội');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('500000');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formErr, setFormErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-homestays'],
    enabled: !!tokens,
    queryFn: async () => {
      const res = await api.get<{ results?: HomestayListItem[] } | HomestayListItem[]>(
        '/homestays/',
        { params: { mine: 1 } },
      );
      const body = res.data;
      return Array.isArray(body) ? body : body.results ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ id: string }>('/homestays/', {
        title,
        description: 'Mô tả ngắn — chỉnh sửa sau.',
        type: 'entire_house',
        status: 'published',
        address,
        city,
        district: '',
        latitude: '21.0285',
        longitude: '105.8542',
        price_per_night: price,
        max_guests: 4,
        num_bedrooms: 2,
        num_bathrooms: 1,
        rules: '',
        cancellation_policy: 'flexible',
      });
      const homestayId = res.data.id;
      if (homestayId && imageFile) {
        const payload = new FormData();
        payload.append('image', imageFile);
        payload.append('is_cover', 'true');
        payload.append('order', '0');
        await api.post(`/homestays/${homestayId}/images/`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-homestays'] });
      setFormErr('');
      setTitle('');
      setAddress('');
      setImageFile(null);
    },
    onError: (e) => setFormErr(formatApiError(e, 'Không tạo được homestay.')),
  });

  if (!tokens) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <section>
        <h1 className="text-2xl font-semibold">Listing của bạn</h1>
        {isLoading && <p className="mt-4 text-slate-500">Đang tải…</p>}
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((h) => (
            <HomestayCard key={h.id} h={h} />
          ))}
        </div>
        {(data ?? []).length === 0 && !isLoading && (
          <p className="mt-4 text-slate-600">Chưa có listing. Tạo mới bên dưới.</p>
        )}
      </section>
      <section className="border border-slate-200 rounded-xl p-6 bg-white max-w-lg">
        <h2 className="font-semibold">Tạo homestay nhanh</h2>
        {formErr && <p className="mt-3 text-sm text-red-600">{formErr}</p>}
        <div className="mt-4 space-y-3">
          <input
            placeholder="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            placeholder="Địa chỉ"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            placeholder="Thành phố"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            placeholder="Giá / đêm (VND)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="w-full border rounded-md px-3 py-2"
          />
          <button
            type="button"
            disabled={!title || !address || create.isPending}
            onClick={() => create.mutate()}
            className="rounded-md bg-brand-600 text-white px-4 py-2 disabled:opacity-50"
          >
            Tạo & xuất bản
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          <Link to="/search" className="text-brand-600">
            Xem trang tìm kiếm
          </Link>
        </p>
      </section>
    </div>
  );
}
