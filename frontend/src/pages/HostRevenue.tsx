import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppSelector } from '../store';

interface RevenueData {
  total_revenue: number;
  total_bookings: number;
  monthly_stats: {
    month: string;
    revenue: number;
    count: number;
  }[];
  homestay_stats: {
    homestay_id: string;
    homestay_name: string;
    revenue: number;
    count: number;
  }[];
}

export function HostRevenue() {
  const tokens = useAppSelector((s) => s.auth.tokens);

  const { data, isLoading, error } = useQuery<RevenueData>({
    queryKey: ['host-revenue'],
    queryFn: async () => {
      const res = await axios.get('/api/bookings/revenue/', {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      return res.data;
    },
    enabled: !!tokens?.access,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-stone-100 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 bg-stone-100 rounded-3xl" />
            <div className="h-64 bg-stone-100 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-ink">Có lỗi xảy ra khi tải dữ liệu doanh thu.</h2>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const maxMonthlyRevenue = Math.max(...data.monthly_stats.map((m) => m.revenue), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-ink tracking-tight">Báo cáo doanh thu</h1>
        <p className="text-stone-500 mt-2">Tổng quan về hiệu quả kinh doanh của các homestay của bạn.</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-between">
          <span className="text-stone-500 font-medium mb-2">Tổng doanh thu</span>
          <span className="text-4xl font-black text-brand-700 tracking-tighter">
            {formatCurrency(data.total_revenue)}
          </span>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col justify-between">
          <span className="text-stone-500 font-medium mb-2">Tổng lượt đặt phòng</span>
          <span className="text-4xl font-black text-ink tracking-tighter">
            {data.total_bookings} <span className="text-lg font-medium text-stone-400">lượt</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Chart (Simple CSS implementation) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <h3 className="text-xl font-bold text-ink mb-8">Doanh thu theo tháng</h3>
          <div className="flex items-end justify-between h-64 gap-2">
            {data.monthly_stats.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                Chưa có dữ liệu tháng
              </div>
            ) : (
              data.monthly_stats.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center group relative">
                  <div 
                    className="w-full bg-brand-100 group-hover:bg-brand-500 rounded-t-lg transition-all duration-500 relative"
                    style={{ height: `${(m.revenue / maxMonthlyRevenue) * 100}%`, minHeight: '4px' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                      {formatCurrency(m.revenue)}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 mt-3 uppercase tracking-wider">
                    {m.month}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Homestays */}
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <h3 className="text-xl font-bold text-ink mb-8">Theo Homestay</h3>
          <div className="space-y-6">
            {data.homestay_stats.length === 0 ? (
              <div className="text-stone-400 py-4 text-center">Chưa có dữ liệu</div>
            ) : (
              data.homestay_stats.map((h, idx) => (
                <div key={h.homestay_id} className="flex items-center gap-4">
                  <div className="flex-none w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-xs font-bold text-stone-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink truncate text-sm">{h.homestay_name}</p>
                    <p className="text-xs text-stone-500">{h.count} lượt đặt</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-700 text-sm">{formatCurrency(h.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
