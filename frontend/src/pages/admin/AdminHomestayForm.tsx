import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api, formatApiError } from '../../services/api';
import type { AdminHomestayDetail, AdminHostOption, AmenityOption } from '../../types';

function labelInput(cls: string) {
  return `block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5 ${cls}`;
}

function inputCls() {
  return 'w-full rounded-xl bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2.5 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-600/50';
}

export function AdminHomestayForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Route tạo mới là /admin/homestays/new (không có :id),
  // nên useParams không trả về id ở màn tạo.
  const isCreate = !id;

  const { data: hosts } = useQuery({
    queryKey: ['admin', 'hosts'],
    queryFn: async () => {
      const res = await api.get<AdminHostOption[]>('/admin/hosts/');
      return res.data;
    },
  });

  const { data: amenityOptions } = useQuery({
    queryKey: ['admin', 'amenities'],
    queryFn: async () => {
      const res = await api.get<AmenityOption[]>('/admin/amenities/');
      return res.data;
    },
  });

  const {
    data: detail,
    isLoading: loadingDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['admin', 'homestay', id],
    enabled: !isCreate && !!id,
    queryFn: async () => {
      const res = await api.get<AdminHomestayDetail>(`/admin/homestays/${id}/`);
      return res.data;
    },
  });

  const [hostId, setHostId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('entire_house');
  const [status, setStatus] = useState('draft');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [numBedrooms, setNumBedrooms] = useState('1');
  const [numBathrooms, setNumBathrooms] = useState('1');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [rules, setRules] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('flexible');
  const [pendingReview, setPendingReview] = useState(false);
  const [amenityIds, setAmenityIds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageCover, setImageCover] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoErr, setGeoErr] = useState('');

  useEffect(() => {
    if (hosts?.length && !hostId && isCreate) {
      setHostId(hosts[0].id);
    }
  }, [hosts, hostId, isCreate]);

  useEffect(() => {
    if (!detail) return;
    setHostId(detail.host);
    setTitle(detail.title);
    setDescription(detail.description ?? '');
    setType(detail.type);
    setStatus(detail.status);
    setAddress(detail.address);
    setCity(detail.city);
    setDistrict(detail.district ?? '');
    setLatitude(detail.latitude ?? '');
    setLongitude(detail.longitude ?? '');
    setPricePerNight(String(detail.price_per_night ?? ''));
    setMaxGuests(String(detail.max_guests));
    setNumBedrooms(String(detail.num_bedrooms));
    setNumBathrooms(String(detail.num_bathrooms));
    setCheckInTime(detail.check_in_time?.slice(0, 5) ?? '');
    setCheckOutTime(detail.check_out_time?.slice(0, 5) ?? '');
    setRules(detail.rules ?? '');
    setCancellationPolicy(detail.cancellation_policy);
    setPendingReview(detail.pending_admin_review);
    setAmenityIds(detail.amenities.map((a) => a.id));
  }, [detail]);

  const amenitiesByCat = useMemo(() => {
    const m = new Map<string, AmenityOption[]>();
    for (const a of amenityOptions ?? []) {
      const k = a.category || 'Khác';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    }
    return m;
  }, [amenityOptions]);

  function toggleAmenity(aid: string) {
    setAmenityIds((prev) => (prev.includes(aid) ? prev.filter((x) => x !== aid) : [...prev, aid]));
  }

  async function geocodeAddress() {
    const query = [address.trim(), district.trim(), city.trim(), 'Vietnam'].filter(Boolean).join(', ');
    if (!query) {
      setGeoErr('Nhập địa chỉ/thành phố trước khi tự lấy tọa độ.');
      return null;
    }
    setGeoLoading(true);
    setGeoErr('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
      const first = data?.[0];
      if (!first?.lat || !first?.lon) {
        setGeoErr('Không tìm được tọa độ phù hợp từ địa chỉ đã nhập.');
        return null;
      }
      const nextLat = String(first.lat);
      const nextLng = String(first.lon);
      setLatitude(nextLat);
      setLongitude(nextLng);
      return { latitude: nextLat, longitude: nextLng };
    } catch {
      setGeoErr('Không tự lấy được tọa độ. Kiểm tra mạng hoặc thử nhập cụ thể hơn.');
      return null;
    } finally {
      setGeoLoading(false);
    }
  }

  async function buildPayload() {
    let latValue = latitude.trim();
    let lngValue = longitude.trim();
    if (!latValue || !lngValue) {
      const auto = await geocodeAddress();
      if (auto) {
        latValue = auto.latitude;
        lngValue = auto.longitude;
      }
    }
    return {
      host: hostId,
      title,
      description,
      type,
      status,
      address,
      city,
      district: district || '',
      latitude: latValue === '' ? null : latValue,
      longitude: lngValue === '' ? null : lngValue,
      price_per_night: pricePerNight,
      max_guests: Number.parseInt(maxGuests, 10) || 1,
      num_bedrooms: Number.parseInt(numBedrooms, 10) || 1,
      num_bathrooms: Number.parseInt(numBathrooms, 10) || 1,
      check_in_time: checkInTime ? `${checkInTime}:00` : null,
      check_out_time: checkOutTime ? `${checkOutTime}:00` : null,
      rules,
      cancellation_policy: cancellationPolicy,
      pending_admin_review: pendingReview,
      amenities: amenityIds,
    };
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = await buildPayload();
      if (isCreate) {
        const res = await api.post<AdminHomestayDetail>('/admin/homestays/', payload);
        return res.data;
      }
      const res = await api.patch<AdminHomestayDetail>(`/admin/homestays/${id}/`, payload);
      return res.data;
    },
    onSuccess: async (data) => {
      setFormErr('');
      if (isCreate && data?.id && imageFile) {
        try {
          const payload = new FormData();
          payload.append('image', imageFile);
          payload.append('is_cover', String(imageCover));
          payload.append('order', '0');
          await api.post(`/homestays/${data.id}/images/`, payload);
          setImageFile(null);
          setImageCover(false);
        } catch (e) {
          setFormErr(formatApiError(e, 'Đã tạo phòng nhưng thêm ảnh thất bại.'));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'homestays'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      if (isCreate && data?.id) navigate(`/admin/homestays/${data.id}`, { replace: true });
      else void refetchDetail();
    },
    onError: (e) => setFormErr(formatApiError(e, 'Không lưu được.')),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      await api.delete(`/admin/homestays/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'homestays'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      navigate('/admin/homestays');
    },
    onError: (e) => setFormErr(formatApiError(e, 'Không xóa được.')),
  });

  const addImageMut = useMutation({
    mutationFn: async () => {
      if (!id || isCreate) return;
      const payload = new FormData();
      if (!imageFile) return;
      payload.append('image', imageFile);
      payload.append('is_cover', String(imageCover));
      payload.append('order', '0');
      await api.post(`/homestays/${id}/images/`, payload);
    },
    onSuccess: () => {
      setImageFile(null);
      setImageCover(false);
      refetchDetail();
      queryClient.invalidateQueries({ queryKey: ['admin', 'homestays'] });
    },
    onError: (e) => setFormErr(formatApiError(e, 'Không thêm ảnh được.')),
  });

  const removeImageMut = useMutation({
    mutationFn: async (imgId: string) => {
      if (!id || isCreate) return;
      await api.delete(`/homestays/${id}/images/${imgId}/`);
    },
    onSuccess: () => {
      refetchDetail();
      queryClient.invalidateQueries({ queryKey: ['admin', 'homestays'] });
    },
    onError: (e) => setFormErr(formatApiError(e, 'Không xóa ảnh được.')),
  });

  if (!isCreate && loadingDetail && !detail) {
    return <div className="text-slate-400 text-sm animate-pulse py-20 text-center">Đang tải homestay…</div>;
  }

  if (!isCreate && !loadingDetail && !detail) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-6 py-8 text-red-200 text-sm">
        Không tìm thấy homestay.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <Link to="/admin/homestays" className="text-xs text-slate-500 hover:text-brand-400 transition">
            ← Danh sách phòng
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">{isCreate ? 'Thêm phòng mới' : 'Chỉnh sửa phòng'}</h1>
        </div>
        {!isCreate && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Xóa homestay này? Không xóa được nếu còn đặt phòng đang hoạt động.')) deleteMut.mutate();
            }}
            disabled={deleteMut.isPending}
            className="rounded-xl border border-red-900/60 text-red-400 text-sm font-medium px-4 py-2 hover:bg-red-950/40 disabled:opacity-40 transition"
          >
            Xóa phòng
          </button>
        )}
      </div>

      {formErr && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/25 px-4 py-3 text-red-200 text-sm">{formErr}</div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-8">
        <section className="grid sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelInput('')}>Chủ nhà *</label>
            <select value={hostId} onChange={(e) => setHostId(e.target.value)} className={inputCls()} required>
              {!hosts?.length && <option value="">Đang tải host…</option>}
              {hosts?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.full_name} ({h.email})
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelInput('')}>Tiêu đề *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls()} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelInput('')}>Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls()} />
          </div>
          <div>
            <label className={labelInput('')}>Loại hình</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls()}>
              <option value="entire_house">Cả căn</option>
              <option value="private_room">Phòng riêng</option>
              <option value="shared_room">Phòng chung</option>
            </select>
          </div>
          <div>
            <label className={labelInput('')}>Trạng thái hiển thị</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls()}>
              <option value="draft">Nháp</option>
              <option value="published">Đang hiển thị</option>
              <option value="suspended">Tạm ngưng</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
            <input type="checkbox" checked={pendingReview} onChange={(e) => setPendingReview(e.target.checked)} className="rounded border-slate-600" />
            <span className="text-sm text-slate-300">Đánh dấu chờ duyệt admin</span>
          </label>
        </section>

        <section className="grid sm:grid-cols-2 gap-5 border-t border-slate-800 pt-8">
          <div className="sm:col-span-2">
            <label className={labelInput('')}>Địa chỉ *</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls()} required />
          </div>
          <div>
            <label className={labelInput('')}>Thành phố *</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls()} required />
          </div>
          <div>
            <label className={labelInput('')}>Quận/Huyện</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} className={inputCls()} />
          </div>
          <div>
            <label className={labelInput('')}>Vĩ độ</label>
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} className={inputCls()} placeholder="optional" />
          </div>
          <div>
            <label className={labelInput('')}>Kinh độ</label>
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} className={inputCls()} placeholder="optional" />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void geocodeAddress()}
              disabled={geoLoading}
              className="rounded-xl border border-slate-600 text-slate-300 text-xs font-semibold px-4 py-2 hover:bg-slate-800 disabled:opacity-40 transition"
            >
              {geoLoading ? 'Đang lấy tọa độ…' : 'Tự lấy tọa độ theo địa chỉ'}
            </button>
            {geoErr && <p className="text-xs text-amber-300">{geoErr}</p>}
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 border-t border-slate-800 pt-8">
          <div>
            <label className={labelInput('')}>Giá / đêm *</label>
            <input type="number" min={0} step={1000} value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} className={inputCls()} required />
          </div>
          <div>
            <label className={labelInput('')}>Số khách tối đa</label>
            <input type="number" min={1} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className={inputCls()} />
          </div>
          <div>
            <label className={labelInput('')}>Phòng ngủ</label>
            <input type="number" min={1} value={numBedrooms} onChange={(e) => setNumBedrooms(e.target.value)} className={inputCls()} />
          </div>
          <div>
            <label className={labelInput('')}>Phòng tắm</label>
            <input type="number" min={1} value={numBathrooms} onChange={(e) => setNumBathrooms(e.target.value)} className={inputCls()} />
          </div>
          <div>
            <label className={labelInput('')}>Giờ nhận phòng</label>
            <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={inputCls()} />
          </div>
          <div>
            <label className={labelInput('')}>Giờ trả phòng</label>
            <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className={inputCls()} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelInput('')}>Chính sách hủy</label>
            <select value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} className={inputCls()}>
              <option value="flexible">Linh hoạt</option>
              <option value="moderate">Vừa phải</option>
              <option value="strict">Chặt</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelInput('')}>Nội quy</label>
            <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} className={inputCls()} />
          </div>
        </section>

        <section className="border-t border-slate-800 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Tiện ích</h2>
          <div className="space-y-6">
            {[...amenitiesByCat.entries()].map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-slate-500 mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((a) => (
                    <label
                      key={a.id}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium border transition ${
                        amenityIds.includes(a.id)
                          ? 'border-brand-500 bg-brand-600/20 text-brand-200'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <input type="checkbox" className="sr-only" checked={amenityIds.includes(a.id)} onChange={() => toggleAmenity(a.id)} />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-800 pt-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Ảnh</h2>
          {!isCreate && detail && (
            <div className="flex flex-wrap gap-3">
              {detail.images.map((im) => (
                <div key={im.id} className="relative group w-28 h-20 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                  <img src={im.url} alt="" className="w-full h-full object-cover" />
                  {im.is_cover && (
                    <span className="absolute top-1 left-1 text-[10px] bg-brand-600 text-white px-1 rounded">Cover</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImageMut.mutate(im.id)}
                    className="absolute inset-0 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[220px]">
              <label className={labelInput('')}>{isCreate ? 'Ảnh đầu tiên' : 'Thêm ảnh từ máy'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className={inputCls()}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-400 pb-2">
              <input type="checkbox" checked={imageCover} onChange={(e) => setImageCover(e.target.checked)} />
              Đặt làm ảnh bìa
            </label>
            {!isCreate && (
              <button
                type="button"
                disabled={!imageFile || addImageMut.isPending}
                onClick={() => addImageMut.mutate()}
                className="rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-40"
              >
                Thêm ảnh
              </button>
            )}
          </div>
          {isCreate && (
            <p className="text-xs text-slate-500">
              Ảnh sẽ được upload Cloudinary ngay sau khi bấm Lưu.
            </p>
          )}
        </section>

        {!isCreate && detail && (
          <section className="border-t border-slate-800 pt-8 space-y-4">
            <p className="text-xs text-slate-500">
              Bạn có thể thêm nhiều ảnh bằng nút Thêm ảnh ở trên.
            </p>
          </section>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            disabled={saveMut.isPending || !hostId}
            onClick={() => saveMut.mutate()}
            className="rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-semibold px-6 py-3 transition"
          >
            {saveMut.isPending ? 'Đang lưu…' : 'Lưu'}
          </button>
          <Link
            to="/admin/homestays"
            className="rounded-xl border border-slate-600 text-slate-300 text-sm font-medium px-6 py-3 hover:bg-slate-800 transition inline-flex items-center"
          >
            Hủy
          </Link>
        </div>
      </div>
    </div>
  );
}
