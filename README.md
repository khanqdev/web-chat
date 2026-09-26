# Web Chat – Frontend

Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand, React Router v7, react-hook-form + zod, react-i18next (vi/en). Kiến trúc chi tiết: `docs/plan/06-kien-truc-frontend.md`; thiết kế: `docs/design/`.

## Chạy dự án

```bash
npm install
npm run dev        # http://localhost:5173
```

Mặc định `npm run dev` bật **MSW** (`VITE_USE_MOCKS=true` trong `.env.development`) nên không cần backend. Tài khoản mẫu và mã OTP cố định của mock nằm ở `src/mocks/data.ts` (mã OTP cũng được in ra console khi đăng ký). Mock áp dụng đúng quy tắc của contract: sai mật khẩu/OTP 5 lần bị khoá 15 phút, OTP hết hạn sau 5 phút, gửi lại cách nhau ≥ 60 giây. Trạng thái mock nằm trong bộ nhớ nên tải lại trang là mất (tài khoản vừa đăng ký cũng mất).

Các màn đã có: `/login` (email + Google), `/register`, `/register/verify` (OTP), `/forgot-password`, `/forgot-password/reset` (OTP + mật khẩu mới), `/` (trang tạm sau đăng nhập).

Để gọi backend Spring Boot thật (proxy `/api`, `/ws` → `localhost:8080`), tạo `.env.local`:

```
VITE_USE_MOCKS=false
```

Các biến môi trường khác xem `.env.example`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Kiểm tra kiểu (`tsc -b`) rồi build |
| `npm run typecheck` | Chỉ kiểm tra kiểu |
| `npm run lint` | ESLint |

## Deploy lên Vercel

`vercel.json` đã cấu hình sẵn:

- Mọi route không phải `/api` trả về `index.html` (React Router ở chế độ SPA).
- `/api/*` được Vercel chuyển tiếp sang backend. Trình duyệt chỉ thấy một domain nên cookie refresh `SameSite=Strict` vẫn chạy và REST không cần CORS.
- `/assets/*` cache 1 năm (tên file có hash); `Cross-Origin-Opener-Policy: same-origin-allow-popups` để popup Google Sign-In hoạt động.

Các bước:

1. **Sửa domain backend** trong `vercel.json`: thay `CHANGE-ME.duckdns.org` bằng domain thật của server (Vercel không đọc được biến môi trường trong `rewrites`).
2. Trên vercel.com → **Add New Project** → import repo `khanqdev/web-chat`. Framework Vite được nhận tự động.
3. **Environment Variables** (Production + Preview):

   | Biến | Giá trị |
   |---|---|
   | `VITE_API_BASE_URL` | `/api` (server hiện dùng `/api/auth`; đổi thành `/api/v1` khi server đổi path) |
   | `VITE_GOOGLE_CLIENT_ID` | Client ID Google OAuth |
   | `VITE_WS_URL` | `wss://<domain-backend>/ws-chat/websocket` |

   Không đặt `VITE_USE_MOCKS` (production gọi backend thật). Muốn bản demo chỉ có mock thì đặt `VITE_USE_MOCKS=true`.
4. Google Cloud Console → OAuth client → **Authorized JavaScript origins**: thêm `https://<tên-dự-án>.vercel.app`.
5. Phía backend: thêm `https://<tên-dự-án>.vercel.app` vào `ALLOWED_ORIGINS` (cho WebSocket, vì Vercel không chuyển tiếp WebSocket). Cookie refresh **không** đặt thuộc tính `Domain`.

## Cấu trúc

```
src/
├─ app/          main.tsx, router.tsx (guard đăng nhập), providers.tsx
├─ components/   ui/ (shadcn) · common/ (GlassPanel, LanguageSwitcher, ThemeToggle…)
├─ features/     auth/ (api.ts, schema.ts, components/, pages/)
├─ lib/          http.ts (refresh single-flight, ApiError), i18n.ts, theme.ts, errors.ts
├─ locales/      vi/, en/ (common, auth, errors)
├─ mocks/        MSW handlers + dữ liệu mẫu
├─ stores/       Zustand (session: access token chỉ trong bộ nhớ)
└─ styles/       globals.css (token sáng/tối + lớp liquid glass)
```

Thêm component shadcn: `npx shadcn@latest add <tên>` (cấu hình ở `components.json`).
