import { Link, Navigate } from 'react-router-dom';
import { useMe } from '../hooks/useMe';
import { useAppSelector } from '../store';

function roleLabel(role: string): string {
  if (role === 'guest') return 'Khách';
  if (role === 'host') return 'Chủ nhà';
  if (role === 'admin') return 'Quản trị viên';
  return role;
}

export function Profile() {
  const tokens = useAppSelector((s) => s.auth.tokens);
  const { data, isLoading } = useMe();

  if (!tokens) return <Navigate to="/login" replace />;

  if (isLoading || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-stone-500 animate-pulse">
        Đang tải hồ sơ…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 sm:py-20">
      <div className="card-auth">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-xl font-bold text-white shadow-soft">
            {data.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide font-bold text-stone-400">Tài khoản</p>
            <h1 className="text-xl font-bold text-ink mt-1">{data.full_name}</h1>
            <span className="inline-flex mt-2 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide bg-brand-100 text-brand-800 capitalize">
              {roleLabel(data.role)}
            </span>
          </div>
        </div>

        {data.role === 'admin' && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Bạn đang dùng quyền quản trị</p>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Trang khách dùng để đặt homestay; bảng điều khiển admin là không gian riêng cho vận hành.
            </p>
            <Link
              to="/admin"
              className="mt-3 inline-flex rounded-xl bg-slate-900 text-white text-xs font-semibold px-4 py-2 hover:bg-slate-800 transition"
            >
              Mở bảng điều khiển admin
            </Link>
          </div>
        )}

        <dl className="mt-10 space-y-5 text-sm">
          <div className="flex justify-between gap-4 border-b border-stone-100 pb-4">
            <dt className="text-stone-500 font-medium">Email</dt>
            <dd className="font-semibold text-ink text-right break-all">{data.email}</dd>
          </div>
          <div className="flex justify-between gap-4 pb-4">
            <dt className="text-stone-500 font-medium">Xác minh</dt>
            <dd className="font-semibold text-ink">
              {data.is_verified ? (
                <span className="text-emerald-600">Đã xác minh</span>
              ) : (
                <span className="text-amber-600">Chưa xác minh</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
