import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout, useAppDispatch, useAppSelector } from '../../store';
import { useMe } from '../../hooks/useMe';

const sideInactive =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/80 hover:text-white transition';
const sideActive = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold bg-brand-600 text-white shadow-lg shadow-brand-900/30';

function navClass(active: boolean) {
  return active ? sideActive : sideInactive;
}

export function AdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const tokens = useAppSelector((s) => s.auth.tokens);
  const { data: me } = useMe();

  const path = location.pathname;

  function handleLogout() {
    dispatch(logout());
    queryClient.removeQueries({ queryKey: ['users', 'me'] });
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900/95">
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <NavLink to="/admin" className="flex flex-col leading-tight">
            <span className="font-bold text-white tracking-tight">StayVi Admin</span>
            <span className="text-[11px] text-slate-500">Phòng · đặt chỗ · thống kê</span>
          </NavLink>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/admin" end className={({ isActive }) => navClass(isActive)}>
            <svg className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Thống kê
          </NavLink>
          <NavLink to="/admin/homestays" end className={() => navClass(path.startsWith('/admin/homestays'))}>
            <svg className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Quản lý phòng
          </NavLink>
          <NavLink to="/admin/bookings" className={({ isActive }) => navClass(isActive)}>
            <svg className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Đơn đặt phòng
          </NavLink>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <NavLink
            to="/"
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            ← Về trang khách
          </NavLink>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 lg:h-16 shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="lg:hidden font-semibold text-white truncate">Admin</span>
            <span className="hidden sm:inline text-sm text-slate-500 truncate">
              {me?.full_name ? `${me.full_name} · ${me.email}` : tokens ? 'Đang tải…' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NavLink
              to="/"
              className="rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition hidden sm:inline-flex"
            >
              Site khách
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-red-400 hover:bg-red-950/50 transition"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>

        <footer className="shrink-0 border-t border-slate-800 py-3 px-6 text-center text-xs text-slate-600">
          API · /api/admin/ &amp; /api/bookings/
        </footer>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `text-[10px] font-medium flex flex-col items-center gap-0.5 ${isActive ? 'text-brand-400' : 'text-slate-500'}`
          }
        >
          <span>TK</span>
        </NavLink>
        <NavLink
          to="/admin/homestays"
          className={() =>
            `text-[10px] font-medium flex flex-col items-center gap-0.5 ${path.startsWith('/admin/homestays') ? 'text-brand-400' : 'text-slate-500'}`
          }
        >
          <span>Phòng</span>
        </NavLink>
        <NavLink
          to="/admin/bookings"
          className={({ isActive }) =>
            `text-[10px] font-medium flex flex-col items-center gap-0.5 ${isActive ? 'text-brand-400' : 'text-slate-500'}`
          }
        >
          <span>Đơn</span>
        </NavLink>
      </nav>
    </div>
  );
}
