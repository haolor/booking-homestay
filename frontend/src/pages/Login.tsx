import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, formatApiError, normalizeLoginEmail } from '../services/api';
import { logout, setTokens, useAppDispatch } from '../store';
import type { UserMe } from '../types';

type LoginLocationState = {
  from?: string;
  reason?: string;
  message?: string;
};

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const locState = (location.state ?? null) as LoginLocationState | null;
  const returnTo = locState?.from && locState.from.startsWith('/') ? locState.from : undefined;
  const infoBanner = locState?.message;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const loginEmail = normalizeLoginEmail(email);
      const res = await api.post<{ access: string; refresh: string }>('/auth/login/', {
        email: loginEmail,
        password,
      });
      dispatch(setTokens({ access: res.data.access, refresh: res.data.refresh }));
      const meRes = await api.get<UserMe>('/users/me/');
      queryClient.setQueryData(['users', 'me'], meRes.data);

      const wantsAdmin = returnTo?.startsWith('/admin');
      if (wantsAdmin && meRes.data.role !== 'admin') {
        dispatch(logout());
        queryClient.removeQueries({ queryKey: ['users', 'me'] });
        setErr('Tài khoản này không có quyền admin. Dùng đúng email admin hoặc chạy seed_demo để tạo demo.admin@booking-homestay.local.');
        return;
      }

      if (meRes.data.role === 'admin') {
        navigate(returnTo && returnTo.startsWith('/admin') ? returnTo : '/admin', { replace: true });
      } else if (returnTo && !returnTo.startsWith('/admin')) {
        navigate(returnTo, { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      setErr(formatApiError(err, 'Sai email hoặc mật khẩu.'));
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="card-auth">
        <h1 className="text-2xl font-bold text-ink">Đăng nhập</h1>
        <p className="mt-2 text-sm text-stone-500 leading-relaxed">
          Dùng tài khoản demo trong footer nếu bạn đã chạy <code className="text-brand-700">seed_demo</code>.
        </p>
        {infoBanner && (
          <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 leading-relaxed">
            {infoBanner}
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-ink">
            Email
            <input
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo.admin@booking-homestay.local"
              autoComplete="username"
              className="input-field"
            />
          </label>
          <p className="text-xs text-stone-500 -mt-3 leading-snug">
            Email demo có đuôi <code className="text-brand-700 bg-brand-50 px-1 rounded">.local</code> — ô nhập kiểu text để trình duyệt không chặn kiểu “email không hợp lệ”.
          </p>
          <label className="block text-sm font-semibold text-ink">
            Mật khẩu
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="input-field"
            />
          </label>
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
          <button type="submit" className="btn-primary w-full rounded-2xl py-3 mt-2">
            Đăng nhập
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-stone-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
