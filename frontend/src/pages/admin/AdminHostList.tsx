import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import type { AdminHostRow } from '../../types';
import { AdminHostDetailDrawer } from './AdminHostDetailDrawer';

export function AdminHostList() {
  const [selectedHost, setSelectedHost] = useState<AdminHostRow | null>(null);
  
  const { data: hosts, isLoading } = useQuery({
    queryKey: ['admin', 'hosts'],
    queryFn: async () => {
      const res = await api.get<AdminHostRow[]>('/admin/hosts/');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Host</h1>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">Danh sách tất cả các chủ nhà trên hệ thống và các homestay họ sở hữu.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chủ nhà</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
                    <p className="mt-2 text-sm text-slate-500">Đang tải danh sách chủ nhà...</p>
                  </td>
                </tr>
              ) : hosts?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Chưa có chủ nhà nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                hosts?.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/20 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 grid place-items-center text-slate-300 font-bold group-hover:border-brand-500/50 transition">
                          {h.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{h.full_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{h.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-slate-300">{h.email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{h.phone_number || 'Chưa cập nhật số'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400">
                        {new Date(h.date_joined).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                          h.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {h.is_active ? 'Active' : 'Locked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedHost(h)}
                        className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-1.5 text-xs font-bold text-brand-400 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition shadow-sm"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminHostDetailDrawer
        host={selectedHost}
        onClose={() => setSelectedHost(null)}
      />
    </div>
  );
}
