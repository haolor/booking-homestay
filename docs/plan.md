# 🏡 KẾ HOẠCH XÂY DỰNG HỆ THỐNG BOOKING HOMESTAY

> **Stack:** React (Frontend) · Django REST Framework (Backend) · Cloudinary (Cloud Image) · PostgreSQL (Database)

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Tech Stack chi tiết](#2-tech-stack-chi-tiết)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Mô hình dữ liệu (ERD)](#4-mô-hình-dữ-liệu-erd)
5. [Nghiệp vụ hệ thống](#5-nghiệp-vụ-hệ-thống)
6. [API Endpoints](#6-api-endpoints)
7. [Phân quyền người dùng](#7-phân-quyền-người-dùng)
8. [Quy trình đặt phòng](#8-quy-trình-đặt-phòng)
9. [Cấu trúc thư mục dự án](#9-cấu-trúc-thư-mục-dự-án)
10. [Kế hoạch triển khai](#10-kế-hoạch-triển-khai)

---

## 1. Tổng quan hệ thống

Hệ thống **Homestay Booking** là nền tảng kết nối khách du lịch (Guest) với chủ nhà (Host) muốn cho thuê phòng/căn hộ/ngôi nhà. Hệ thống hỗ trợ:

- Tìm kiếm và lọc homestay theo nhiều tiêu chí
- Đặt phòng trực tuyến với lịch khả dụng thời gian thực
- Thanh toán tích hợp (VNPay, Momo, Stripe)
- Quản lý đánh giá & nhận xét
- Dashboard quản lý cho Host và Admin
- Thông báo realtime qua Email / WebSocket

---

## 2. Tech Stack chi tiết

| Layer | Công nghệ | Mục đích |
|---|---|---|
| **Frontend** | React 18 + Vite | SPA, UI/UX |
| **State Management** | Redux Toolkit + React Query | Global state + Server cache |
| **UI Library** | TailwindCSS + shadcn/ui | Styling |
| **Map** | Leaflet.js / Mapbox GL | Bản đồ homestay |
| **Backend** | Django 5 + DRF | REST API |
| **Auth** | Simple JWT + OAuth2 (Google/Facebook) | Xác thực |
| **Database** | PostgreSQL 15 | Dữ liệu chính |
| **Cache** | Redis | Session, Cache, Celery broker |
| **Task Queue** | Celery + Redis | Email, Notification async |
| **Cloud Image** | Cloudinary | Upload/CDN ảnh |
| **Payment** | VNPay + Stripe | Thanh toán |
| **Realtime** | Django Channels + WebSocket | Chat, Notification |
| **Search** | Django Filter + Elasticsearch (optional) | Tìm kiếm nâng cao |
| **Deploy** | Docker + Nginx + Railway/Render | Production |

---

## 3. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│   React SPA  │  Mobile Browser  │  Admin Dashboard           │
└─────────────────────────┬───────────────────────────────────┘
                           │ HTTPS / WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                      NGINX (Reverse Proxy)                   │
│              Static Files  │  API Routing  │  SSL            │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
┌──────────────▼──────┐    ┌──────────────▼──────────────────┐
│   React Build       │    │     Django Application           │
│   (Static Files)    │    │  ┌─────────────────────────┐    │
└─────────────────────┘    │  │   REST API (DRF)         │    │
                           │  │   WebSocket (Channels)   │    │
                           │  │   Celery Tasks           │    │
                           │  └───────────┬─────────────┘    │
                           └──────────────┼──────────────────┘
                                          │
              ┌───────────────────────────┼────────────────────┐
              │                           │                    │
┌─────────────▼────┐    ┌─────────────────▼──┐   ┌────────────▼──┐
│  PostgreSQL      │    │  Redis              │   │  Cloudinary   │
│  (Main DB)       │    │  (Cache + Queue)    │   │  (Images CDN) │
└──────────────────┘    └─────────────────────┘   └───────────────┘
```

---

## 4. Mô hình dữ liệu (ERD)

### 4.1 Bảng `User` (Người dùng)
```
User
├── id (UUID, PK)
├── email (unique)
├── password_hash
├── full_name
├── phone_number
├── avatar (Cloudinary URL)
├── role: ENUM(guest, host, admin)
├── is_verified (email)
├── is_active
├── date_joined
└── last_login
```

### 4.2 Bảng `HostProfile` (Hồ sơ chủ nhà)
```
HostProfile
├── id (UUID, PK)
├── user_id (FK → User)
├── bio
├── response_rate (%)
├── response_time (hours)
├── is_superhost (bool)
├── bank_account_info (encrypted)
├── id_card_front (Cloudinary)
├── id_card_back (Cloudinary)
└── verified_at
```

### 4.3 Bảng `Homestay` (Nhà/phòng cho thuê)
```
Homestay
├── id (UUID, PK)
├── host_id (FK → User)
├── title
├── description
├── type: ENUM(entire_house, private_room, shared_room)
├── status: ENUM(draft, published, suspended)
├── address
├── city
├── district
├── latitude / longitude
├── price_per_night (decimal)
├── max_guests
├── num_bedrooms
├── num_bathrooms
├── check_in_time / check_out_time
├── rules (text)
├── created_at / updated_at
└── avg_rating (cached)
```

### 4.4 Bảng `HomestayImage` (Ảnh homestay)
```
HomestayImage
├── id (UUID, PK)
├── homestay_id (FK → Homestay)
├── cloudinary_public_id
├── url
├── is_cover (bool)
└── order (int)
```

### 4.5 Bảng `Amenity` & `HomestayAmenity` (Tiện nghi)
```
Amenity
├── id, name, icon, category

HomestayAmenity
├── homestay_id (FK)
└── amenity_id (FK)
```

### 4.6 Bảng `Booking` (Đặt phòng)
```
Booking
├── id (UUID, PK)
├── homestay_id (FK → Homestay)
├── guest_id (FK → User)
├── check_in_date
├── check_out_date
├── num_guests
├── num_nights (computed)
├── price_per_night (snapshot)
├── subtotal
├── service_fee (5%)
├── total_price
├── status: ENUM(pending, confirmed, cancelled, completed, rejected)
├── cancellation_reason
├── cancelled_by (FK → User, nullable)
├── created_at
└── updated_at
```

### 4.7 Bảng `Payment` (Thanh toán)
```
Payment
├── id (UUID, PK)
├── booking_id (FK → Booking)
├── amount
├── method: ENUM(vnpay, momo, stripe, bank_transfer)
├── status: ENUM(pending, success, failed, refunded)
├── transaction_id (từ payment gateway)
├── paid_at
└── refunded_at
```

### 4.8 Bảng `Review` (Đánh giá)
```
Review
├── id (UUID, PK)
├── booking_id (FK → Booking, unique)
├── reviewer_id (FK → User)
├── homestay_id (FK → Homestay)
├── rating_overall (1-5)
├── rating_cleanliness (1-5)
├── rating_accuracy (1-5)
├── rating_checkin (1-5)
├── rating_communication (1-5)
├── rating_location (1-5)
├── rating_value (1-5)
├── comment
├── host_reply
├── host_replied_at
└── created_at
```

### 4.9 Bảng `BlockedDate` (Ngày khoá lịch)
```
BlockedDate
├── id (UUID, PK)
├── homestay_id (FK → Homestay)
├── date
└── reason (nullable)
```

### 4.10 Bảng `Notification` (Thông báo)
```
Notification
├── id (UUID, PK)
├── user_id (FK → User)
├── type: ENUM(booking_new, booking_confirmed, ...)
├── title
├── message
├── data (JSON)
├── is_read
└── created_at
```

### 4.11 Bảng `Conversation` & `Message` (Chat)
```
Conversation
├── id, guest_id, host_id, homestay_id, created_at

Message
├── id, conversation_id, sender_id, content, is_read, sent_at
```

---

## 5. Nghiệp vụ hệ thống

### 5.1 Quản lý tài khoản (Authentication & User)

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| AU-01 | Đăng ký tài khoản | Guest/Host đăng ký bằng email + password hoặc Google/Facebook OAuth |
| AU-02 | Xác minh email | Gửi email xác minh sau khi đăng ký, có thời hạn 24h |
| AU-03 | Đăng nhập | Login bằng JWT (access token 15 phút, refresh token 7 ngày) |
| AU-04 | Quên mật khẩu | Gửi link reset password qua email (hết hạn sau 1h) |
| AU-05 | Cập nhật hồ sơ | Chỉnh sửa thông tin cá nhân, avatar |
| AU-06 | Đăng ký Host | Guest nâng cấp thành Host, cần xác minh CCCD/Passport |
| AU-07 | Đăng xuất | Invalidate refresh token |

### 5.2 Quản lý Homestay (Host)

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| HS-01 | Tạo homestay | Host tạo listing mới với đầy đủ thông tin, ảnh |
| HS-02 | Upload ảnh | Upload ảnh lên Cloudinary, tối đa 20 ảnh, kích thước ≤ 5MB/ảnh |
| HS-03 | Chọn ảnh bìa | Đặt 1 ảnh làm cover hiển thị trên kết quả tìm kiếm |
| HS-04 | Cập nhật thông tin | Chỉnh sửa tiêu đề, mô tả, giá, tiện nghi |
| HS-05 | Quản lý giá | Đặt giá theo ngày trong tuần, ngày lễ (optional) |
| HS-06 | Khoá lịch | Chặn ngày không cho đặt (đi du lịch, bảo trì...) |
| HS-07 | Xuất bản / Ẩn | Chuyển trạng thái draft ↔ published |
| HS-08 | Xoá homestay | Chỉ xoá được khi không có booking pending/confirmed |

### 5.3 Tìm kiếm & Khám phá (Guest)

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| SE-01 | Tìm kiếm cơ bản | Lọc theo địa điểm, ngày check-in/out, số khách |
| SE-02 | Lọc nâng cao | Lọc theo giá, loại phòng, tiện nghi, đánh giá tối thiểu |
| SE-03 | Sắp xếp kết quả | Theo giá, đánh giá, mới nhất |
| SE-04 | Xem trên bản đồ | Hiển thị homestay trên Leaflet map theo toạ độ |
| SE-05 | Xem chi tiết | Trang chi tiết homestay: ảnh, mô tả, lịch, đánh giá |
| SE-06 | Kiểm tra khả dụng | Real-time check ngày còn trống theo lịch đặt |
| SE-07 | Wishlist | Lưu homestay yêu thích |

### 5.4 Quy trình đặt phòng (Booking)

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| BK-01 | Tạo booking | Guest chọn ngày, số khách → tạo booking `pending` |
| BK-02 | Xác nhận booking (Host) | Host có 24h để xác nhận, từ chối. Quá hạn tự huỷ |
| BK-03 | Thanh toán | Sau khi xác nhận, Guest thanh toán qua VNPay/Momo/Stripe |
| BK-04 | Xác nhận thanh toán | Webhook từ payment gateway → cập nhật booking `confirmed` |
| BK-05 | Check-in | Host đánh dấu Guest đã check-in |
| BK-06 | Check-out | Hệ thống tự động chuyển `confirmed` → `completed` sau ngày checkout |
| BK-07 | Huỷ phòng (Guest) | Guest huỷ: theo chính sách hoàn tiền của Host |
| BK-08 | Huỷ phòng (Host) | Host huỷ: hoàn 100% cho Guest, trừ điểm uy tín Host |
| BK-09 | Lịch sử đặt phòng | Xem lại các booking đã qua |

### 5.5 Chính sách hoàn tiền (Cancellation Policy)

| Loại chính sách | Điều kiện | Hoàn tiền |
|---|---|---|
| Linh hoạt (Flexible) | Huỷ trước 1 ngày check-in | Hoàn 100% |
| Vừa phải (Moderate) | Huỷ trước 5 ngày check-in | Hoàn 50% |
| Chặt chẽ (Strict) | Huỷ trước 14 ngày check-in | Hoàn 50%; dưới 14 ngày: không hoàn |

### 5.6 Đánh giá & Nhận xét (Review)

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| RV-01 | Guest đánh giá | Chỉ đánh giá được sau khi booking `completed`. Thời hạn 14 ngày |
| RV-02 | Host trả lời | Host phản hồi review của Guest (public) |
| RV-03 | Tính điểm trung bình | Tự động cập nhật `avg_rating` trên homestay |
| RV-04 | Báo cáo review | Báo cáo review vi phạm cho Admin xử lý |

### 5.7 Thanh toán & Doanh thu

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| PM-01 | Thanh toán online | VNPay, Momo, Stripe với redirect/webhook |
| PM-02 | Phí dịch vụ | Hệ thống thu 5% trên mỗi booking từ Guest |
| PM-03 | Hoa hồng Host | Host nhận 95% giá phòng sau khi trừ phí |
| PM-04 | Thanh toán cho Host | Admin duyệt thanh toán cho Host sau checkout 2 ngày |
| PM-05 | Hoàn tiền | Tự động hoàn tiền theo chính sách huỷ phòng |
| PM-06 | Báo cáo doanh thu | Host xem báo cáo thu nhập theo tháng/năm |

### 5.8 Thông báo (Notification)

| Sự kiện | Kênh | Người nhận |
|---|---|---|
| Booking mới | Email + In-app | Host |
| Booking được xác nhận | Email + In-app | Guest |
| Thanh toán thành công | Email + In-app | Guest + Host |
| Nhắc nhở check-in (1 ngày trước) | Email | Guest |
| Booking bị huỷ | Email + In-app | Guest + Host |
| Review mới | In-app | Host |
| Tin nhắn mới | In-app + Email digest | Guest/Host |

### 5.9 Chat realtime

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| CH-01 | Gửi tin nhắn | Guest liên hệ Host trước/sau khi đặt phòng |
| CH-02 | Trạng thái đọc | Đánh dấu tin nhắn đã đọc realtime qua WebSocket |
| CH-03 | Lịch sử hội thoại | Lưu toàn bộ lịch sử nhắn tin |

### 5.10 Quản trị (Admin)

| Mã NV | Tên nghiệp vụ | Mô tả |
|---|---|---|
| AD-01 | Duyệt Host | Xác minh hồ sơ Host mới đăng ký |
| AD-02 | Quản lý Homestay | Duyệt, từ chối, ẩn homestay vi phạm |
| AD-03 | Quản lý User | Khoá/mở khoá tài khoản |
| AD-04 | Quản lý Booking | Xem, can thiệp tranh chấp giữa Guest/Host |
| AD-05 | Duyệt thanh toán | Xác nhận chuyển tiền cho Host |
| AD-06 | Báo cáo tổng hợp | Doanh thu, số booking, tỷ lệ huỷ theo kỳ |
| AD-07 | Quản lý danh mục | Quản lý tiện nghi, loại phòng |

---

## 6. API Endpoints

### Auth
```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/token/refresh/
POST   /api/auth/password/reset/
POST   /api/auth/password/reset/confirm/
POST   /api/auth/email/verify/
GET    /api/auth/social/google/
```

### Users
```
GET    /api/users/me/
PATCH  /api/users/me/
POST   /api/users/me/avatar/
POST   /api/users/host/register/
GET    /api/users/{id}/profile/
```

### Homestays
```
GET    /api/homestays/                  # List + Search + Filter
POST   /api/homestays/                  # Create (Host only)
GET    /api/homestays/{id}/
PUT    /api/homestays/{id}/             # Update (Host owner)
DELETE /api/homestays/{id}/
POST   /api/homestays/{id}/images/
DELETE /api/homestays/{id}/images/{img_id}/
GET    /api/homestays/{id}/availability/
POST   /api/homestays/{id}/block-dates/
GET    /api/homestays/{id}/reviews/
```

### Bookings
```
GET    /api/bookings/                   # My bookings (Guest or Host)
POST   /api/bookings/                   # Create booking
GET    /api/bookings/{id}/
POST   /api/bookings/{id}/confirm/      # Host xác nhận
POST   /api/bookings/{id}/reject/       # Host từ chối
POST   /api/bookings/{id}/cancel/       # Guest/Host huỷ
POST   /api/bookings/{id}/checkin/
```

### Payments
```
POST   /api/payments/create/            # Khởi tạo thanh toán
GET    /api/payments/vnpay/return/      # VNPay callback
POST   /api/payments/stripe/webhook/    # Stripe webhook
GET    /api/payments/{booking_id}/
```

### Reviews
```
POST   /api/reviews/                    # Tạo review (sau completed)
GET    /api/reviews/{id}/
POST   /api/reviews/{id}/reply/         # Host reply
POST   /api/reviews/{id}/report/
```

### Conversations & Messages
```
GET    /api/conversations/
POST   /api/conversations/
GET    /api/conversations/{id}/messages/
POST   /api/conversations/{id}/messages/
```

### Notifications
```
GET    /api/notifications/
PATCH  /api/notifications/{id}/read/
POST   /api/notifications/read-all/
```

### Admin
```
GET    /api/admin/dashboard/
GET    /api/admin/users/
PATCH  /api/admin/users/{id}/
GET    /api/admin/homestays/pending/
POST   /api/admin/homestays/{id}/approve/
GET    /api/admin/payments/pending/
POST   /api/admin/payments/{id}/process/
```

---

## 7. Phân quyền người dùng

| Tính năng | Guest | Host | Admin |
|---|:---:|:---:|:---:|
| Xem homestay | ✅ | ✅ | ✅ |
| Đặt phòng | ✅ | ✅ | ❌ |
| Tạo homestay | ❌ | ✅ | ✅ |
| Xác nhận booking | ❌ | ✅ (của mình) | ✅ |
| Viết đánh giá | ✅ (sau booking) | ❌ | ❌ |
| Reply đánh giá | ❌ | ✅ (homestay của mình) | ✅ |
| Xem doanh thu | ❌ | ✅ (của mình) | ✅ |
| Quản lý user | ❌ | ❌ | ✅ |
| Duyệt homestay | ❌ | ❌ | ✅ |

---

## 8. Quy trình đặt phòng

```
[Guest tìm kiếm]
       │
       ▼
[Chọn homestay + ngày]
       │
       ▼
[Kiểm tra lịch trống]──── Không còn ────► [Thông báo hết phòng]
       │
    Còn trống
       │
       ▼
[Tạo Booking - status: PENDING]
       │
       ▼
[Gửi thông báo cho Host]
       │
       ▼
    ┌──┴──────────────────────────────────────────────────┐
    │                   Host có 24h để phản hồi            │
    │  ┌─────────────────┐          ┌────────────────────┐ │
    │  │  Host Xác nhận  │          │   Host Từ chối     │ │
    │  └────────┬────────┘          └─────────┬──────────┘ │
    │           │                             │             │
    └───────────┼─────────────────────────────┼────────────┘
                │                             │
                ▼                             ▼
   [status: AWAITING_PAYMENT]        [status: REJECTED]
                │                     [Thông báo Guest]
                ▼
   [Guest thanh toán trong 2h]
                │
       ┌────────┴────────┐
       │   Thanh toán    │
  Thành công         Thất bại / Hết giờ
       │                 │
       ▼                 ▼
[status: CONFIRMED]  [status: CANCELLED]
[Email xác nhận]     [Thông báo Guest]
       │
       ▼
   [Ngày checkout]
       │
       ▼
[status: COMPLETED]
       │
       ▼
[Mở form đánh giá cho Guest]
[Chuyển tiền cho Host sau 2 ngày]
```

---

## 9. Cấu trúc thư mục dự án

```
homestay-booking/
│
├── backend/                        # Django Project
│   ├── config/                     # Settings, URLs, WSGI
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── celery.py
│   │
│   ├── apps/
│   │   ├── authentication/         # JWT, OAuth, Email verify
│   │   ├── users/                  # User model, HostProfile
│   │   ├── homestays/              # Homestay, Image, Amenity, BlockedDate
│   │   ├── bookings/               # Booking, cancellation logic
│   │   ├── payments/               # VNPay, Stripe integration
│   │   ├── reviews/                # Review, Reply
│   │   ├── conversations/          # Chat, Messages
│   │   ├── notifications/          # Notification, Celery tasks
│   │   └── core/                   # Shared utils, permissions
│   │
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   │
│   └── Dockerfile
│
├── frontend/                       # React Project (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/             # Button, Input, Modal, ...
│   │   │   ├── layout/             # Header, Footer, Sidebar
│   │   │   ├── homestay/           # HomestayCard, Gallery, Map
│   │   │   ├── booking/            # BookingForm, Calendar, Summary
│   │   │   └── review/             # ReviewCard, StarRating
│   │   │
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── Search/
│   │   │   ├── HomestayDetail/
│   │   │   ├── Booking/
│   │   │   ├── Payment/
│   │   │   ├── Profile/
│   │   │   ├── Host/               # Host dashboard
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Listings/
│   │   │   │   └── Bookings/
│   │   │   └── Admin/
│   │   │
│   │   ├── store/                  # Redux Toolkit
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API calls (Axios)
│   │   ├── utils/
│   │   └── router/                 # React Router v6
│   │
│   ├── Dockerfile
│   └── vite.config.js
│
├── nginx/
│   └── nginx.conf
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 10. Kế hoạch triển khai

### Phase 1 — Core MVP (Tuần 1–4)
- [ ] Setup project: Django + React + PostgreSQL + Docker
- [ ] Authentication: JWT, đăng ký, đăng nhập, verify email
- [ ] CRUD Homestay + Upload ảnh Cloudinary
- [ ] Tìm kiếm cơ bản theo địa điểm/ngày/số khách
- [ ] Flow đặt phòng: pending → confirmed → completed
- [ ] Tích hợp thanh toán VNPay

### Phase 2 — Enhanced Features (Tuần 5–8)
- [ ] Tích hợp bản đồ Leaflet + geocoding
- [ ] Hệ thống đánh giá & review
- [ ] Thông báo email via Celery + SMTP
- [ ] Quản lý lịch Host (blocked dates, pricing)
- [ ] Admin dashboard cơ bản
- [ ] Stripe payment

### Phase 3 — Realtime & Optimization (Tuần 9–12)
- [ ] Chat realtime (Django Channels + WebSocket)
- [ ] Thông báo in-app realtime
- [ ] Tìm kiếm nâng cao + Elasticsearch
- [ ] Báo cáo doanh thu Host
- [ ] OAuth Google/Facebook
- [ ] Performance: Redis caching, query optimization
- [ ] Deploy production: Railway/Render + CDN

---

## 📌 Biến môi trường quan trọng

```env
# Django
SECRET_KEY=
DEBUG=False
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ALLOWED_HOSTS=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Payment
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_CLOUDINARY_CLOUD_NAME=
VITE_MAPBOX_TOKEN=
```

---

*Tài liệu này sẽ được cập nhật theo từng phase phát triển.*
