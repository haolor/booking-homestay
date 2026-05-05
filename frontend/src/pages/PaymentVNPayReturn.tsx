import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api, formatApiError } from '../services/api';

type PaymentReturnResponse = {
  mock: boolean;
  payment: {
    id: string;
    booking: string;
    amount: string;
    method: string;
    status: string;
    transaction_id: string;
    paid_at: string | null;
    created_at: string;
  };
};

function formatVnd(amountStr: string): string {
  const n = Number.parseFloat(amountStr);
  if (Number.isNaN(n)) return amountStr;
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫';
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    vnpay: 'VNPay',
    momo: 'Momo',
    stripe: 'Stripe',
    bank_transfer: 'Chuyển khoản',
  };
  return map[method] ?? method;
}

export function PaymentVNPayReturn() {
  const [params] = useSearchParams();
  const query = Object.fromEntries(params.entries());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['vnpay-return', query],
    queryFn: async () => {
      const res = await api.get<PaymentReturnResponse>('/payments/vnpay/return/', { params: query });
      return res.data;
    },
  });

  const isSuccess = data?.payment?.status === 'success';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/20 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div
            className={`h-11 w-11 rounded-full grid place-items-center text-xl ${
              isSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
            }`}
          >
            {isSuccess ? '✓' : '✕'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Kết quả thanh toán</h1>
            <p className={`text-sm mt-1 ${isSuccess ? 'text-emerald-300' : 'text-red-300'}`}>
              {isLoading ? 'Đang xác nhận giao dịch...' : isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}
            </p>
          </div>
        </div>

        {isLoading && <p className="mt-6 text-slate-400 text-sm">Vui lòng chờ trong giây lát.</p>}

        {isError && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
            {formatApiError(error, 'Không xác minh được giao dịch.')}
          </div>
        )}

        {data && (
          <>
            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-slate-400">Số tiền</p>
                <p className="mt-1 font-semibold text-white text-base">{formatVnd(data.payment.amount)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-slate-400">Phương thức</p>
                <p className="mt-1 font-semibold text-white text-base">{methodLabel(data.payment.method)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-slate-400">Mã giao dịch</p>
                <p className="mt-1 font-semibold text-white break-all">{data.payment.transaction_id || '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-slate-400">Thời gian thanh toán</p>
                <p className="mt-1 font-semibold text-white">{formatDateTime(data.payment.paid_at)}</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Mã đơn đặt phòng: <span className="text-slate-300">{data.payment.booking}</span>
              {data.mock && <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">Môi trường giả lập</span>}
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/my-bookings"
            className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 transition"
          >
            Xem đơn của tôi
          </Link>
          <Link
            to="/search"
            className="rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-medium px-4 py-2.5 transition"
          >
            Tiếp tục tìm homestay
          </Link>
        </div>
      </div>
    </div>
  );
}
