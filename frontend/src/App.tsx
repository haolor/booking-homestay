import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './components/auth/RequireAdmin';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminHomestayForm } from './pages/admin/AdminHomestayForm';
import { AdminHomestayList } from './pages/admin/AdminHomestayList';
import { AdminHostList } from './pages/admin/AdminHostList';
import { BookingDetail } from './pages/BookingDetail';
import { Home } from './pages/Home';
import { HomestayDetailPage } from './pages/HomestayDetail';
import { HostListings } from './pages/HostListings';
import { Login } from './pages/Login';
import { MyBookings } from './pages/MyBookings';
import { PaymentVNPayReturn } from './pages/PaymentVNPayReturn';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { Search } from './pages/Search';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cần `/admin/*` để khớp /admin/homestays, /admin/bookings… (React Router v6) */}
        <Route path="/admin/*" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="homestays" element={<AdminHomestayList />} />
            <Route path="homestays/new" element={<AdminHomestayForm />} />
            <Route path="homestays/:id" element={<AdminHomestayForm />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="hosts" element={<AdminHostList />} />
          </Route>
        </Route>

        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="homestays/:id" element={<HomestayDetailPage />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="host/listings" element={<HostListings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="payment/vnpay-return" element={<PaymentVNPayReturn />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
