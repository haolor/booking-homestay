import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { AdminDashboardStats } from '../../types';

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function formatVnd(amountStr: string): string {
  const n = Number.parseFloat(amountStr);
  if (Number.isNaN(n)) return amountStr;
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';
}

function statusVi(kind: 'booking' | 'homestay', key: string): string {
  const b: Record<string, string> = {
    pending: 'Chờ chủ nhà',
    awaiting_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
    rejected: 'Từ chối',
  };
  const h: Record<string, string> = {
    draft: 'Nháp',
    published: 'Đang hiển thị',
    suspended: 'Tạm ngưng',
  };
  if (kind === 'booking') return b[key] ?? key;
  return h[key] ?? key;
}

export function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await api.get<AdminDashboardStats>('/admin/dashboard/');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-800/80" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-6 py-8 text-red-200 text-sm">
        Không tải được thống kê. Đảm bảo đăng nhập tài khoản admin và backend đang chạy.
      </div>
    );
  }

  const bookingBars = data.bookings_per_day_last_week ?? [];
  const maxDay = Math.max(1, ...bookingBars.map((d) => d.count));
  const chartHeight = 220;
  const chartWidth = 720;
  const chartPadding = { top: 20, right: 20, bottom: 36, left: 34 };
  const innerW = chartWidth - chartPadding.left - chartPadding.right;
  const innerH = chartHeight - chartPadding.top - chartPadding.bottom;
  const points = bookingBars.map((d, i) => {
    const x =
      bookingBars.length <= 1
        ? chartPadding.left + innerW / 2
        : chartPadding.left + (i / (bookingBars.length - 1)) * innerW;
    const y = chartPadding.top + (1 - d.count / maxDay) * innerH;
    return { ...d, x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartPadding.top + innerH} L ${points[0].x} ${chartPadding.top + innerH} Z`
      : '';

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Thống kê & vận hành</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Tổng quan đặt phòng, homestay và doanh thu thanh toán trong tháng. Chi tiết CRUD phòng và đơn nằm ở menu bên trái.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/homestays"
            className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 transition"
          >
            Quản lý phòng
          </Link>
          <Link
            to="/admin/bookings"
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2.5 border border-slate-700 transition"
          >
            Đơn đặt phòng
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Đặt phòng (tháng này)" value={data.bookings_month} />
        <StatCard label="Hủy (tháng này)" value={data.cancellations_month} />
        <StatCard label="Doanh thu thanh toán OK" value={formatVnd(data.revenue_month)} hint="Trong tháng hiện tại" />
        <StatCard label="Chờ thanh toán (hiện tại)" value={data.bookings_pending_payment ?? 0} />
        <StatCard label="Homestay (tổng)" value={data.homestays_total ?? data.homestays_published} />
        <StatCard label="Homestay đang publish" value={data.homestays_published} />
        <StatCard label="Người dùng" value={data.users_total} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Đặt phòng theo trạng thái</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(data.bookings_by_status ?? {}).map(([k, v]) => (
              <li key={k} className="flex justify-between text-sm">
                <span className="text-slate-400">{statusVi('booking', k)}</span>
                <span className="font-semibold text-white tabular-nums">{v}</span>
              </li>
            ))}
            {Object.keys(data.bookings_by_status ?? {}).length === 0 && (
              <li className="text-slate-500 text-sm">Chưa có dữ liệu.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Homestay theo trạng thái</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(data.homestays_by_status ?? {}).map(([k, v]) => (
              <li key={k} className="flex justify-between text-sm">
                <span className="text-slate-400">{statusVi('homestay', k)}</span>
                <span className="font-semibold text-white tabular-nums">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Đặt phòng 7 ngày gần nhất</h2>
        <p className="mt-1 text-xs text-slate-500">Biểu đồ xu hướng số booking theo ngày</p>
        {bookingBars.length === 0 ? (
          <p className="text-slate-500 text-sm py-8">Chưa có đặt phòng trong tuần.</p>
        ) : (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartPadding.top + ratio * innerH;
                const label = Math.round((1 - ratio) * maxDay);
                return (
                  <g key={ratio}>
                    <line x1={chartPadding.left} x2={chartPadding.left + innerW} y1={y} y2={y} stroke="rgb(51 65 85)" strokeWidth="1" />
                    <text x={chartPadding.left - 8} y={y + 4} textAnchor="end" fill="rgb(100 116 139)" fontSize="10">
                      {label}
                    </text>
                  </g>
                );
              })}

              {areaPath && <path d={areaPath} fill="rgba(34, 211, 238, 0.12)" />}
              {linePath && <path d={linePath} fill="none" stroke="rgb(34 211 238)" strokeWidth="3" strokeLinecap="round" />}

              {points.map((p) => (
                <g key={`${p.date}-${p.count}`}>
                  <circle cx={p.x} cy={p.y} r="4" fill="rgb(34 211 238)" />
                  <text x={p.x} y={chartPadding.top + innerH + 18} textAnchor="middle" fill="rgb(148 163 184)" fontSize="10">
                    {p.date ? p.date.slice(5) : '—'}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
