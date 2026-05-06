import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout, useAppDispatch, useAppSelector } from '../../store';
import { useMe } from '../../hooks/useMe';

const navInactive = 'text-stone-600 hover:text-brand-700 transition';
const navActive = 'bg-brand-100 text-brand-800 font-semibold';

export function PublicLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tokens = useAppSelector((s) => s.auth.tokens);
  const { data: me } = useMe();

  function handleLogout() {
    dispatch(logout());
    queryClient.removeQueries({ queryKey: ['users', 'me'] });
    navigate('/');
  }

  const isHost = me?.role === 'host';
  const isAdmin = me?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-ink tracking-tight group-hover:text-brand-800 transition">
                StayVi
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Homestay & trải nghiệm</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm flex-wrap justify-end">
            {!isHost && (
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 transition ${isActive ? navActive : navInactive}`
                }
              >
                Khám phá
              </NavLink>
            )}

            {tokens && (
              <>
                {isHost && (
                  <NavLink
                    to="/host/listings"
                    className={({ isActive }) =>
                      `rounded-full px-3.5 py-2 transition ${isActive ? navActive : navInactive}`
                    }
                  >
                    Quản lý nhà
                  </NavLink>
                )}
                {isHost && (
                  <NavLink
                    to="/host/revenue"
                    className={({ isActive }) =>
                      `rounded-full px-3.5 py-2 transition ${isActive ? navActive : navInactive}`
                    }
                  >
                    Doanh thu
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `rounded-full px-3.5 py-2 transition ${isActive ? navActive : navInactive}`
                    }
                  >
                    Quản trị
                  </NavLink>
                )}
                <NavLink
                  to="/my-bookings"
                  className={({ isActive }) =>
                    `rounded-full px-3.5 py-2 transition ${isActive ? navActive : navInactive}`
                  }
                >
                  Phòng đã đặt
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `rounded-full px-3.5 py-2 transition ${isActive ? navActive : navInactive}`
                  }
                >
                  Hồ sơ
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full px-3.5 py-2 text-stone-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  Đăng xuất
                </button>
              </>
            )}

            {!tokens && (
              <>
                <Link to="/login" className={`rounded-full px-3.5 py-2 ${navInactive}`}>
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-full px-4 py-2 bg-brand-600 text-white font-semibold shadow-soft hover:bg-brand-700 transition"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-12 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <p className="font-semibold text-ink">StayVi</p>
            <p className="mt-2 text-stone-500 leading-relaxed">
              Nền tảng demo đặt homestay: tìm theo địa điểm, xem chi tiết, đặt phòng.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink text-xs uppercase tracking-wide text-stone-400">
              Demo
            </p>
            <p className="mt-3 text-stone-600 leading-relaxed">
              Khách:{' '}
              <code className="text-brand-700 bg-brand-50 px-1 rounded">demo.guest@booking-homestay.local</code>
              {' · Admin: '}
              <code className="text-brand-700 bg-brand-50 px-1 rounded">demo.admin@booking-homestay.local</code>
              {' · mật khẩu '}
              <code className="text-brand-700 bg-brand-50 px-1 rounded">demo12345</code>
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink text-xs uppercase tracking-wide text-stone-400">
              Liên hệ (MVP)
            </p>
            <p className="mt-3 text-stone-500">booking-homestay · Swagger tại /api/docs/</p>
          </div>
        </div>
        <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Booking Homestay MVP
        </div>
      </footer>
    </div>
  );
}
