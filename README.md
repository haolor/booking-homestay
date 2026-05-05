# Booking Homestay

Monorepo theo [docs/plan.md](docs/plan.md): **Django 5 + DRF** (backend), **React 18 + Vite** (frontend), PostgreSQL, Redis, Celery, Channels (WebSocket chat), VNPay/Stripe hooks.

## Chạy nhanh (local)

### Backend

```bash
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements/development.txt
# Tùy chọn: copy .env.example -> .env và chỉnh DATABASE_URL (hoặc để trống để dùng SQLite)
py manage.py migrate
py manage.py seed_demo   # tuỳ chọn: homestay + user demo (mật khẩu demo12345)
py manage.py runserver
```

API: `http://127.0.0.1:8000/api/` — Swagger: `http://127.0.0.1:8000/api/docs/`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Ứng dụng: `http://localhost:5173` — proxy `/api` → backend (xem `vite.config.ts`).

### Docker

```bash
docker compose up --build
```

- API: `http://localhost:8000/api/`
- Frontend (nginx): `http://localhost:5173` — `/api` proxy tới service `backend`.

## Biến môi trường

Xem [backend/.env.example](backend/.env.example) và [frontend/.env.example](frontend/.env.example) (VNPay return URL, Cloudinary, Stripe, v.v.).

## Tests

```bash
cd backend
py -3.13 -m pytest
```
