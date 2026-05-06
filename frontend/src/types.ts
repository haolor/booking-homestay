export type HomestayListItem = {
  id: string;
  title: string;
  city: string;
  district: string;
  price_per_night: string;
  max_guests: number;
  type: string;
  status: string;
  avg_rating: string;
  latitude: string | null;
  longitude: string | null;
  cover_url: string | null;
  amenities: string[];
};

export type HomestayDetail = HomestayListItem & {
  host: string;
  description: string;
  address: string;
  num_bedrooms: number;
  num_bathrooms: number;
  rules: string;
  cancellation_policy: string;
  images: { id: string; url: string; is_cover: boolean }[];
  amenities: { id: string; name: string; icon: string; category: string }[];
};

export type UserMe = {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: string;
  avatar: string;
  is_verified: boolean;
  is_active?: boolean;
  date_joined?: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type AdminDashboardStats = {
  bookings_month: number;
  cancellations_month: number;
  revenue_month: string;
  users_total: number;
  homestays_total: number;
  homestays_published: number;
  bookings_pending_payment: number;
  bookings_by_status: Record<string, number>;
  homestays_by_status: Record<string, number>;
  bookings_per_day_last_week: { date: string | null; count: number }[];
};

export type AdminHomestayRow = {
  id: string;
  title: string;
  city: string;
  district: string;
  status: string;
  type: string;
  price_per_night: string;
  max_guests: number;
  host: string;
  host_email: string;
  host_name: string;
  pending_admin_review: boolean;
  avg_rating: string;
  cover_url: string | null;
  created_at: string;
};

export type AmenityOption = {
  id: string;
  name: string;
  icon: string;
  category: string;
};

export type AdminHostOption = {
  id: string;
  email: string;
  full_name: string;
};

export type AdminHostRow = {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  is_active: boolean;
  date_joined: string;
};


export type AdminHomestayDetail = {
  id: string;
  host: string;
  title: string;
  description: string;
  type: string;
  status: string;
  address: string;
  city: string;
  district: string;
  latitude: string | null;
  longitude: string | null;
  price_per_night: string;
  max_guests: number;
  num_bedrooms: number;
  num_bathrooms: number;
  check_in_time: string | null;
  check_out_time: string | null;
  rules: string;
  cancellation_policy: string;
  avg_rating: string;
  pending_admin_review: boolean;
  images: { id: string; url: string; is_cover: boolean; order: number }[];
  amenities: AmenityOption[];
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  homestay: string;
  homestay_title?: string;
  guest?: string;
  guest_email?: string;
  guest_name?: string;
  num_nights: number;
  price_per_night: string;
  subtotal: string;
  service_fee: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_price: string;
  payment_deadline_at?: string | null;
  can_cancel_until?: string | null;
  checked_in_at?: string | null;
  created_at?: string;

};
