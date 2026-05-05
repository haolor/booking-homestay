import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatApiError, normalizeLoginEmail } from '../services/api';
import { setTokens, useAppDispatch } from '../store';
import type { UserMe } from '../types';

export function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [err, setErr] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const regEmail = normalizeLoginEmail(email);
      await api.post('/auth/register/', {
        email: regEmail,
        full_name: fullName,
        password,
        role,
      });
      const res = await api.post<{ access: string; refresh: string }>('/auth/login/', {
        email: regEmail,
        password,
      });
      dispatch(setTokens({ access: res.data.access, refresh: res.data.refresh }));
      const meRes = await api.get<UserMe>('/users/me/');
      queryClient.setQueryData(['users', 'me'], meRes.data);
      navigate('/profile');
    } catch (err) {
      setErr(
        formatApiError(
          err,
          'Đăng ký thất bại — kiểm tra email (chưa tồn tại), mật khẩu tối thiểu 8 ký tự.',
        ),
      );
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="card-auth">
        <h1 className="text-2xl font-bold text-ink">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-stone-500">
          Sau khi đăng nhập có thể <Link to="/search" className="text-brand-700 font-semibold">đặt chỗ</Link>{' '}
          hoặc làm chủ nhà.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-ink">
            Họ tên
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              autoComplete="name"
            />
          </label>
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
              className="input-field"
              autoComplete="username"
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Mật khẩu
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Vai trò
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'guest' | 'host')}
              className="input-field cursor-pointer"
            >
              <option value="guest">Khách — đặt phòng</option>
              <option value="host">Chủ nhà — quản lý listing</option>
            </select>
          </label>
          {err && <p className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
          <button type="submit" className="btn-primary w-full rounded-2xl py-3">
            Hoàn tất đăng ký
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-stone-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
