import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { AdminHomestayRow, AdminHostRow, Paginated } from '../../types';

type Props = {
  host: AdminHostRow | null;
  onClose: () => void;
};

export function AdminHostDetailDrawer({ host, onClose }: Props) {
  const { data: homestays, isLoading } = useQuery({
    queryKey: ['admin', 'homestays', 'host', host?.id],
    queryFn: async () => {
      if (!host) return null;
      const res = await api.get<Paginated<AdminHomestayRow>>(`/admin/homestays/?host=${host.id}`);
      return res.data.results;
    },
    enabled: !!host,
  });

  if (!host) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl shadow-black flex flex-col animate-in slide-in-from-right duration-300">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-white tracking-tight">Chi tiết chủ nhà</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8">
          {/* Host Info Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center text-2xl font-bold">
                {host.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{host.full_name}</h3>
                <p className="text-sm text-slate-400 font-mono">{host.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</p>
                <p className="mt-1 text-sm text-slate-200 truncate">{host.email}</p>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số điện thoại</p>
                <p className="mt-1 text-sm text-slate-200">{host.phone_number || '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tham gia</p>
                <p className="mt-1 text-sm text-slate-200">{new Date(host.date_joined).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</p>
                <p className={`mt-1 text-sm font-semibold ${host.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                  {host.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                </p>
              </div>
            </div>
          </section>

          {/* Homestays Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Danh sách Homestay</h4>
              <span className="text-xs text-slate-500">{homestays?.length || 0} tin đăng</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            ) : homestays?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center">
                <p className="text-sm text-slate-500">Host này chưa có homestay nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {homestays?.map((hs) => (
                  <div
                    key={hs.id}
                    className="group relative rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex gap-4 hover:border-slate-700 transition"
                  >
                    <div className="h-14 w-20 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                      {hs.cover_url ? (
                        <img src={hs.cover_url} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-slate-600">No img</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{hs.title}</p>
                      <p className="text-xs text-slate-500 truncate">{hs.city}, {hs.district}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-brand-400">
                          {new Intl.NumberFormat('vi-VN').format(Number.parseFloat(hs.price_per_night))} ₫
                        </span>
                        <span className={`text-[10px] uppercase font-bold ${hs.status === 'published' ? 'text-emerald-500' : 'text-slate-500'
                          }`}>
                          {hs.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="h-20 border-t border-slate-800 flex items-center px-6 shrink-0 bg-slate-900/50">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
