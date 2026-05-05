import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { api } from '../../services/api';
import type { AdminHomestayRow, Paginated } from '../../types';

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    draft: 'Nháp',
    published: 'Đang hiển thị',
    suspended: 'Tạm ngưng',
  };
  return m[s] ?? s;
}

export function AdminHomestayList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const queryKey = useMemo(() => ['admin', 'homestays', page, q, status], [page, q, status]);

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (q.trim()) params.set('search', q.trim());
      if (status) params.set('status', status);
      const res = await api.get<Paginated<AdminHomestayRow>>(`/admin/homestays/?${params}`);
      return res.data;
    },
  });

  const rows = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(search);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Phòng / Homestay</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            CRUD toàn bộ tin đăng: gán chủ nhà, trạng thái hiển thị, giá và tiện ích. Ảnh thêm sau khi tạo (tab chỉnh sửa).
          </p>
        </div>
        <Link
          to="/admin/homestays/new"
          className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 transition shrink-0"
        >
          + Thêm phòng
        </Link>
      </div>

      <form onSubmit={applySearch} className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề, thành phố…"
          className="rounded-xl bg-slate-900 border border-slate-700 text-white text-sm px-4 py-2.5 min-w-[200px] flex-1 max-w-md placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-600/50"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600/50"
        >
          <option value="">Mọi trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="published">Đang hiển thị</option>
          <option value="suspended">Tạm ngưng</option>
        </select>
        <button type="submit" className="rounded-xl bg-slate-800 border border-slate-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-slate-700 transition">
          Tìm
        </button>
      </form>

      {isLoading && <div className="rounded-2xl border border-slate-800 bg-slate-900/40 h-64 animate-pulse" />}
      {isError && <p className="text-red-400 text-sm">Không tải được danh sách.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Phòng</th>
                <th className="px-4 py-3 font-semibold">Chủ nhà</th>
                <th className="px-4 py-3 font-semibold">TP</th>
                <th className="px-4 py-3 font-semibold">Giá/đêm</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rows.map((row) => (
                <tr key={row.id} className="text-slate-300 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white max-w-[220px] truncate">{row.title}</div>
                    {row.pending_admin_review && (
                      <span className="text-[11px] text-amber-400 font-semibold">Chờ duyệt</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white text-xs">{row.host_name}</div>
                    <div className="text-slate-500 text-xs truncate max-w-[160px]">{row.host_email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.city}</td>
                  <td className="px-4 py-3 tabular-nums text-white">
                    {new Intl.NumberFormat('vi-VN').format(Number.parseFloat(row.price_per_night) || 0)} ₫
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200">{statusLabel(row.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/homestays/${row.id}`}
                      className="text-brand-400 hover:text-brand-300 font-semibold text-xs"
                    >
                      Sửa
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="px-4 py-12 text-center text-slate-500 text-sm">Không có homestay phù hợp.</p>
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
