import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '../../hooks/useMe';
import { useAppSelector } from '../../store';

export function RequireAdmin() {
  const location = useLocation();
  const tokens = useAppSelector((s) => s.auth.tokens);
  const returnTo = `${location.pathname}${location.search}`;
  const { data: me, isLoading, isError, isFetching } = useMe();

  if (!tokens) {
    return <Navigate to="/login" replace state={{ from: returnTo }} />;
  }

  const waitingProfile = (isLoading || isFetching) && !me && !isError;

  if (waitingProfile) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm px-4 text-center">
        Đang xác thực quyền quản trị…
      </div>
    );
  }

  if (isError) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: returnTo,
          reason: 'session',
          message: 'Phiên hết hạn hoặc không tải được hồ sơ. Đăng nhập lại.',
        }}
      />
    );
  }

  if (!me) {
    return <Navigate to="/login" replace state={{ from: returnTo, reason: 'session' }} />;
  }

  if (me.role !== 'admin') {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: returnTo,
          reason: 'admin-only',
          message:
            'Khu vực này chỉ dành cho tài khoản admin. Hãy đăng nhập bằng tài khoản admin (ví dụ demo.admin@booking-homestay.local sau khi chạy seed_demo).',
        }}
      />
    );
  }

  return <Outlet />;
}
