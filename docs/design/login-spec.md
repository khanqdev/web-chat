# Màn hình Đăng nhập – Đặc tả thiết kế (liquid glass)

Nguồn: wireframe "6. Đăng nhập" trên canvas thiết kế của dự án (bản sáng và tối). File `Login.dc.html` cùng thư mục là mã nguồn wireframe để tham khảo bố cục và giá trị CSS; `Main.dc.html` là màn chat chính.

Story liên quan: M1-03 (đăng nhập email), M1-08 (Google), M1-04 (quên mật khẩu), M16-02 (song ngữ). API: `docs/plan/05-api-contract.md` mục 2.1.

## Bố cục (desktop 1280×800, căn giữa, responsive xuống 360px)

1. **Nền:** màu `--background` + 3 mảng màu tròn làm mờ (blur 90–100px) nằm sau thẻ đăng nhập: xanh dương, tím, ngọc.
2. **Góc trên phải:** nút chuyển ngôn ngữ dạng segmented `VI | EN` trên nền kính (`aria-pressed`).
3. **Thẻ đăng nhập** rộng 420px, padding 36px 40px, bo góc 28px, nền kính (`GlassPanel`), khoảng cách dọc giữa các phần 14px. Thứ tự từ trên xuống:
   - Logo vuông 42px bo 14px nền gradient nhấn, chữ "W" trắng + tên sản phẩm `[TÊN SẢN PHẨM]` (16px, 600).
   - Tiêu đề h1 "Chào mừng trở lại" / "Welcome back" (26px, 700, letter-spacing -0.01em).
   - Nút **"Tiếp tục với Google"** cao 46px, full width, viền mảnh, nền `--field` (dùng Google Identity Services, gửi `idToken` tới `POST /auth/google`).
   - Đường kẻ ngang có chữ "hoặc" ở giữa.
   - Trường **Email** (label trên, input cao 46px, bo 14px, placeholder `ban@email.com`).
   - Trường **Mật khẩu** (placeholder "Tối thiểu 8 ký tự"; nên có nút hiện/ẩn mật khẩu).
   - Link **"Quên mật khẩu?"** căn phải, 13px.
   - Vùng báo lỗi (`role="alert"`), nền `--danger-soft`, chữ `--danger`, bo 14px. Ví dụ khi `423 AUTH_LOCKED`: "Sai mật khẩu quá 5 lần. Thử lại sau {{minutes}} phút."
   - Nút **"Đăng nhập"** chính: cao 48px, bo 14px, nền gradient nhấn, chữ trắng 15px/600, đổ bóng xanh.
   - Dòng cuối: "Chưa có tài khoản? **Đăng ký bằng email**" (link tới `/register`).

## Token màu

| Token | Sáng | Tối |
|---|---|---|
| `--background` | `#E9EDF5` | `#090C16` |
| `--foreground` (chữ) | `#10152A` | `#EEF1FA` |
| `--muted-foreground` | `#475069` | `#A6ADC4` |
| `--glass-bg` | `rgb(255 255 255 / 0.55)` | `rgb(20 25 42 / 0.55)` |
| `--glass-bg-strong` | `rgb(255 255 255 / 0.78)` | `rgb(30 36 58 / 0.80)` |
| `--glass-border` | `rgb(255 255 255 / 0.75)` | `rgb(255 255 255 / 0.10)` |
| `--glass-shadow` | `0 10px 40px rgb(28 40 90 / 0.14), inset 0 1px 0 rgb(255 255 255 / 0.9)` | `0 10px 40px rgb(0 0 0 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.08)` |
| `--field` (nền input) | `rgb(255 255 255 / 0.6)` | `rgb(255 255 255 / 0.07)` |
| `--line` (viền input) | `rgb(16 21 42 / 0.08)` | `rgb(255 255 255 / 0.09)` |
| `--accent-ink` (link) | `#2446B8` | `#A9BEFF` |
| `--danger` | `#C0271B` | `#FF7A6E` |
| `--danger-soft` | `rgb(192 39 27 / 0.10)` | `rgb(255 122 110 / 0.14)` |
| Blob 1 / 2 / 3 | `rgb(92 132 255 / .55)` · `rgb(170 120 255 / .45)` · `rgb(64 210 190 / .40)` | `rgb(60 90 255 / .45)` · `rgb(140 70 230 / .40)` · `rgb(20 160 160 / .35)` |
| Gradient nhấn (2 theme) | `linear-gradient(135deg, #3460EE, #6A4CF0)` | như bên trái |

Kính: `background: var(--glass-bg); backdrop-filter: blur(28–32px) saturate(170%); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow)`. Khi `prefers-reduced-transparency: reduce` thì bỏ blur, dùng nền đặc.

Font: **Be Vietnam Pro** (`@fontsource-variable/be-vietnam-pro`), line-height 1.5.

## Hành vi

- Validate bằng zod: email hợp lệ, mật khẩu ≥ 8 ký tự; lỗi hiển thị dưới từng trường.
- Nút Đăng nhập hiện trạng thái loading, khoá khi đang gửi.
- Map mã lỗi API → bản dịch: `AUTH_INVALID_CREDENTIALS`, `AUTH_LOCKED` (dùng `details.retryAfterSec`), `RATE_LIMITED`, `INTERNAL_ERROR`.
- Thành công: lưu access token trong bộ nhớ (không localStorage; refresh token là cookie httpOnly do server đặt), chuyển tới `/`.
- Mọi chuỗi đi qua `react-i18next` (namespace `auth`, `errors`).
