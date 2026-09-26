# Web Chat – Kiến trúc Frontend (v0.1)

_Người lập: Claude (Senior PM) · Ngày: 2026-09-26 · Dựa trên: `05-api-contract.md` v0.2, wireframe liquid (sáng/tối), shadcn/ui, song ngữ vi/en_

Mục tiêu: một kiến trúc **đủ đơn giản cho đội 3 người bán thời gian**, nhưng tách bạch rõ 3 thứ khó nhất của app chat: dữ liệu từ server, sự kiện realtime, và trạng thái tin nhắn đang gửi.

---

## 1. Tech stack

| Nhóm | Chọn | Ghi chú |
|---|---|---|
| Build | **Vite** + **React 19** + **TypeScript** (strict) | SPA thuần, không cần SSR cho app chat sau đăng nhập |
| Routing | **React Router v7** (chế độ SPA) | Quen thuộc, tài liệu nhiều |
| UI | **shadcn/ui** (Radix + **Tailwind CSS v4**), **lucide-react** | Đã chốt 26/09 |
| Hiệu ứng | **Motion** | Tin nhắn mới trượt vào, mở panel, reaction |
| Danh sách tin nhắn | **react-virtuoso** | Chỉ render tin đang hiển thị, hỗ trợ tải thêm khi cuộn lên |
| Emoji | **Frimousse** | Nhẹ, không kèm style, hợp shadcn |
| Dữ liệu server | **TanStack Query v5** | Cache, phân trang, retry, cập nhật lạc quan |
| Trạng thái client | **Zustand** | Chỉ cho thứ không đến từ server (mục 4) |
| Form | **react-hook-form** + **zod** | Dùng chung schema zod để kiểm tra dữ liệu |
| Realtime | **@stomp/stompjs** | STOMP qua WebSocket thuần, tự kết nối lại |
| Song ngữ | **react-i18next** | Chia namespace theo tính năng |
| Kiểu dữ liệu API | **openapi-typescript** sinh từ Swagger của springdoc | Kiểu TS luôn khớp với DTO Java |
| Mock API | **MSW** (Mock Service Worker) | FE làm được trước khi BE xong endpoint |
| Kiểm thử | **Vitest** + Testing Library; **Playwright** cho luồng 2 trình duyệt nhắn tin | |
| Chất lượng | ESLint, Prettier, `tsc --noEmit` trong CI | |

## 2. Cấu trúc thư mục (theo tính năng)

```
frontend/
├─ public/
│  └─ sw.js                       # service worker: nhận web push
├─ src/
│  ├─ app/                        # khởi động ứng dụng
│  │  ├─ main.tsx
│  │  ├─ router.tsx               # định nghĩa route, guard đăng nhập
│  │  ├─ providers.tsx            # QueryClient, i18n, Theme, Realtime, Toaster
│  │  └─ AppShell.tsx             # khung 3 cột: rail · danh sách · nội dung
│  ├─ components/
│  │  ├─ ui/                      # code shadcn sinh ra (button, dialog, input…)
│  │  └─ common/                  # GlassPanel, Avatar, EmptyState, TimeAgo…
│  ├─ features/
│  │  ├─ auth/                    # đăng ký, OTP, đăng nhập, Google, quên mật khẩu
│  │  ├─ conversations/           # danh sách hội thoại, badge chưa đọc, tắt thông báo
│  │  ├─ messages/                # khung chat, bubble, composer, reply, reaction, thu hồi
│  │  ├─ groups/                  # tạo nhóm, thông tin nhóm, thành viên
│  │  ├─ contacts/                # bạn bè, lời mời, tìm theo email
│  │  ├─ uploads/                 # presign → PUT → complete, thanh tiến trình
│  │  ├─ search/
│  │  ├─ notifications/           # xin quyền, đăng ký push, âm báo
│  │  └─ settings/                # hồ sơ, giao diện, ngôn ngữ, quyền riêng tư
│  │     # mỗi feature có: api.ts (query/mutation), components/, hooks/, schema.ts
│  ├─ lib/
│  │  ├─ http.ts                  # fetch wrapper: gắn token, tự refresh, map lỗi
│  │  ├─ realtime/                # client STOMP, bộ phân phối sự kiện, outbox
│  │  ├─ i18n.ts
│  │  ├─ query-keys.ts            # khoá cache tập trung
│  │  └─ text.ts                  # bỏ dấu tiếng Việt, rút gọn preview
│  ├─ stores/                     # Zustand: session, ui, outbox, drafts
│  ├─ types/api.gen.ts            # sinh tự động từ OpenAPI, không sửa tay
│  ├─ locales/{vi,en}/*.json      # common, auth, chat, contacts, settings, errors, system
│  ├─ mocks/                      # MSW handlers + dữ liệu mẫu
│  └─ styles/globals.css          # token màu sáng/tối + lớp liquid glass
└─ vite.config.ts                 # proxy /api và /ws sang Spring Boot khi dev
```

Quy tắc: một feature chỉ được import từ `components/`, `lib/`, `stores/` và **API công khai** của feature khác (file `index.ts`), không import sâu vào bên trong.

## 3. Routing

| Route | Màn hình | Ghi chú |
|---|---|---|
| `/login`, `/register`, `/register/verify`, `/forgot-password` | Xác thực | Chỉ vào được khi chưa đăng nhập |
| `/` | AppShell, chưa chọn hội thoại | Guard: chưa có phiên → gọi `/auth/refresh`, lỗi thì về `/login` |
| `/c/:conversationId` | Khung chat | `?info=1` mở panel thông tin nhóm |
| `/contacts` | Danh bạ, lời mời | |
| `/settings/:tab?` | Cài đặt (dialog trên nền AppShell) | tab: `profile`, `appearance`, `privacy`, `notifications` |

Tách code theo route (`lazy`) cho nhóm xác thực và cài đặt; khung chat tải sẵn vì là màn chính.

## 4. Quản lý trạng thái: ai giữ dữ liệu gì

| Dữ liệu | Nơi giữ | Lý do |
|---|---|---|
| Hội thoại, tin nhắn, bạn bè, thành viên, hồ sơ | **TanStack Query** | Là dữ liệu của server; cần cache, phân trang, làm mới |
| Access token | **Zustand `session`, chỉ trong bộ nhớ** | Không lưu localStorage (đã chốt cookie httpOnly cho refresh token) |
| Tin nhắn đang gửi / gửi lỗi | **Zustand `outbox`** | Chưa có trên server; gắn `clientMsgId` |
| Nháp đang soạn theo từng hội thoại | Zustand `drafts` + localStorage | Không mất khi chuyển hội thoại hoặc tải lại trang |
| Đang soạn tin, hội thoại đang mở, panel mở/đóng | Zustand `ui` | Trạng thái tạm thời |
| Theme, ngôn ngữ | `settings` từ server, bản sao ở localStorage | Áp dụng ngay khi mở trang, trước khi gọi API |

Khoá cache (`lib/query-keys.ts`):

```ts
export const qk = {
  me: ["me"],
  conversations: ["conversations"],
  conversation: (id: string) => ["conversation", id],
  messages: (id: string) => ["messages", id],          // useInfiniteQuery theo beforeSeq
  members: (id: string) => ["members", id],
  friends: ["friends"],
  friendRequests: (dir: "incoming" | "outgoing") => ["friendRequests", dir],
};
```

## 5. Tầng realtime

```
                 ┌──────────── lib/realtime ────────────┐
 STOMP /ws ─────►│ client.ts   kết nối, heartbeat, backoff│
                 │ dispatcher  type → handler             │──► queryClient.setQueryData(...)
                 │ outbox.ts   gửi / ack / gửi lại         │──► Zustand outbox
                 └────────────────────────────────────────┘
```

- **Một kết nối duy nhất** cho cả app, mở sau khi đăng nhập, đóng khi đăng xuất.
- `dispatcher` nhận sự kiện từ `/user/queue/events` và **vá trực tiếp vào cache** của TanStack Query, không gọi lại API:
  - `message.new` → nối vào `messages(id)`, cập nhật `lastMessage`, `unreadCount`, đưa hội thoại lên đầu danh sách; phát âm báo nếu không đang xem; tự gửi `/app/messages.delivered`.
  - `message.recalled`, `reaction.updated`, `delivery.updated`, `read.updated` → sửa đúng tin/hội thoại tương ứng.
  - `conversation.created/updated/removed`, `friend.*`, `settings.updated` → cập nhật hoặc `invalidateQueries`.
- **Kết nối lại:** gọi `/conversations?updatedAfter=` rồi `/messages?afterSeq=` cho các hội thoại đang có trong cache (theo contract mục 3.4), sau đó xả outbox.
- **Token hết hạn:** trước khi kết nối lại, gọi `/auth/refresh` để lấy access token mới cho frame `CONNECT`.

### Luồng gửi một tin nhắn

1. Composer tạo `clientMsgId`, thêm tin vào `outbox` với trạng thái **đang gửi**; UI hiển thị ngay (lạc quan).
2. Gửi `/app/messages.send`.
3. Nhận ack `ok` → xoá khỏi outbox, chèn `Message` thật vào cache (khử trùng theo `clientMsgId`).
4. Không có ack sau 10 giây hoặc ack lỗi → **gửi lỗi**, hiện nút "Gửi lại" (dùng lại `clientMsgId`). Riêng lỗi `RATE_LIMITED` thì khoá composer trong `retryAfterSec`.
5. `delivery.updated` / `read.updated` → cập nhật dấu **đã nhận** / **đã xem**.

Khung chat hiển thị = tin trong cache (theo `seq`) + tin trong outbox của hội thoại đó (luôn ở cuối).

## 6. Tầng HTTP (`lib/http.ts`)

- Gắn `Authorization: Bearer` từ `session`.
- Gặp `401 TOKEN_EXPIRED` → gọi `/auth/refresh` **một lần duy nhất** cho mọi request đang chờ (single-flight), rồi thử lại; refresh thất bại → xoá phiên, về `/login`.
- Chuẩn hoá lỗi thành `ApiError { status, code, details }`; UI hiển thị bằng `t(\`errors.${code}\`)`, thiếu bản dịch thì dùng `errors.INTERNAL_ERROR`.
- `credentials: "include"` cho các route `/auth/*` để trình duyệt gửi cookie refresh.

## 7. Giao diện: token, liquid glass, sáng/tối

- Dùng hệ biến CSS của shadcn (`--background`, `--foreground`, `--primary`…) định nghĩa trong `:root` và `.dark`, lấy đúng bảng màu của wireframe; thêm nhóm biến riêng cho kính:

```css
:root {
  --glass-bg: rgb(255 255 255 / 0.55);
  --glass-bg-strong: rgb(255 255 255 / 0.78);
  --glass-border: rgb(255 255 255 / 0.75);
  --glass-blur: 28px;
  --accent-gradient: linear-gradient(135deg, #3460EE, #6A4CF0);
}
.dark {
  --glass-bg: rgb(20 25 42 / 0.55);
  --glass-bg-strong: rgb(30 36 58 / 0.80);
  --glass-border: rgb(255 255 255 / 0.10);
}
@media (prefers-reduced-transparency: reduce) {
  :root, .dark { --glass-bg: var(--background); --glass-blur: 0px; }
}
```

- Component chung `GlassPanel` gói toàn bộ hiệu ứng kính; chỉ dùng cho **khung** (rail, danh sách, khung chat, dialog, popover, composer), **không** dùng cho từng bubble tin nhắn (để máy yếu vẫn mượt).
- Theme `light | dark | system`: thêm/bỏ class `dark` trên `<html>`, lắng nghe `prefers-color-scheme` khi chọn `system`. Đọc giá trị đã lưu trước khi React render để không bị nháy màu.
- Font **Be Vietnam Pro** qua `@fontsource-variable/be-vietnam-pro` (subset latin + vietnamese), `line-height` ≥ 1.5 trong bubble.
- Chuyển động: tắt/giảm khi người dùng bật `prefers-reduced-motion`.

## 8. Song ngữ

- Namespace: `common`, `auth`, `chat`, `contacts`, `settings`, `errors` (theo mã lỗi của contract), `system` (tin hệ thống).
- Tin hệ thống render từ `SystemEvent`: `t("system.member.added", { actor, targets })`.
- Ngày giờ, số: `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` theo ngôn ngữ đang chọn ("5 phút trước" / "5 minutes ago").
- CI kiểm tra hai file `vi` và `en` có đủ cùng bộ khoá.

## 9. Hiệu năng & trải nghiệm

- `react-virtuoso` với `firstItemIndex` để chèn tin cũ lên đầu mà không nhảy vị trí cuộn; `followOutput` để tự cuộn xuống khi có tin mới (chỉ khi người dùng đang ở cuối).
- Gom các tin liên tiếp của cùng một người trong 2 phút (chỉ hiện avatar/tên ở tin đầu).
- Ảnh: hiện `thumbUrl` trước, giữ chỗ đúng tỉ lệ `width/height` để không giật layout.
- Tab ẩn → ngừng gửi `messages.read`; quay lại tab → gửi `read` cho hội thoại đang mở.

## 10. Làm song song với backend

1. BE bật **springdoc-openapi** → FE chạy `openapi-typescript` sinh `types/api.gen.ts`.
2. Endpoint BE chưa xong → FE dùng **MSW** trả dữ liệu mẫu đúng contract; bật/tắt bằng biến `VITE_USE_MOCKS`.
3. Dev: Vite proxy `/api` và `/ws` sang `localhost:8080` để cookie refresh chạy đúng (same-site).

## 11. Việc làm ngay trong S0 (28/09 – 04/10)

- [ ] Tạo repo `frontend/` (Vite + React + TS), cài Tailwind v4, `shadcn init`, thêm các component: button, input, dialog, dropdown-menu, popover, tooltip, avatar, badge, tabs, sonner (toast), scroll-area, checkbox, radio-group, separator, skeleton.
- [ ] `globals.css`: token sáng/tối + lớp kính; component `GlassPanel`; font Be Vietnam Pro.
- [ ] Khung `AppShell` 3 cột, router, guard đăng nhập, i18n với 2 file vi/en rỗng.
- [ ] `lib/http.ts` (refresh single-flight) và `lib/realtime` bản tối thiểu: kết nối, gửi, nhận `message.new`.
- [ ] **Prototype:** 2 trình duyệt nhắn tin cho nhau qua STOMP (rủi ro lớn nhất của dự án).
- [ ] CI: lint, typecheck, test.
