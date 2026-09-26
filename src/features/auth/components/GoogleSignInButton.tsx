import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  GOOGLE_CLIENT_ID,
  loadGoogleIdentity,
  setGoogleCallback,
} from "@/lib/google-identity";
import { useIsDark } from "@/lib/theme";

import { fieldClass } from "./form-utils";
import { GoogleIcon } from "./GoogleIcon";

type Props = {
  /** Nhận ID token (JWT) khi người dùng chọn tài khoản Google */
  onCredential: (idToken: string) => void;
  /** Báo lỗi hiển thị ở vùng báo lỗi của form (thiếu cấu hình, không tải được GIS) */
  onError: (message: string) => void;
  disabled?: boolean;
};

// GIS giới hạn chiều rộng nút trong khoảng 200–400px
const clampWidth = (w: number) => Math.round(Math.min(400, Math.max(200, w)));

/**
 * Nút đăng nhập Google chính thức của GIS (popup, trả về ID token).
 * Phải dùng nút do Google render: nút tự vẽ không lấy được ID token một cách ổn định.
 */
export function GoogleSignInButton({ onCredential, onError, disabled }: Props) {
  const { t, i18n } = useTranslation("auth");
  const dark = useIsDark();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    GOOGLE_CLIENT_ID ? "loading" : "failed",
  );
  const [width, setWidth] = useState(0);

  // Luôn gọi bản callback mới nhất mà không phải initialize lại GIS
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  });

  useEffect(() => {
    setGoogleCallback((response) =>
      onCredentialRef.current(response.credential),
    );
    return () => setGoogleCallback(null);
  }, []);

  // Nút GIS có chiều rộng cố định theo px → theo dõi chiều rộng khung chứa
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.clientWidth) setWidth(clampWidth(el.clientWidth));
    const observer = new ResizeObserver(([entry]) =>
      setWidth(clampWidth(entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Vẽ lại nút khi đổi theme, ngôn ngữ hoặc chiều rộng
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !width) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then((gis) => {
        const el = containerRef.current;
        if (cancelled || !el) return;
        el.replaceChildren();
        gis.renderButton(el, {
          type: "standard",
          theme: dark ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width,
          locale: i18n.resolvedLanguage,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [dark, i18n.resolvedLanguage, width]);

  const failedMessage = GOOGLE_CLIENT_ID
    ? t("google.loadFailed")
    : t("google.notConfigured");

  return (
    <div className="relative">
      <div
        ref={containerRef}
        aria-busy={status === "loading"}
        className={
          status === "ready"
            ? `flex min-h-11 justify-center ${disabled ? "pointer-events-none opacity-60" : ""}`
            : "pointer-events-none absolute inset-0 opacity-0"
        }
      />
      {status !== "ready" && (
        // Giữ chỗ cùng kích thước khi GIS đang tải; khi lỗi thì bấm vào để hiện lý do
        <Button
          type="button"
          variant="outline"
          className={`${fieldClass} w-full gap-2.5`}
          disabled={status === "loading"}
          onClick={() => onError(failedMessage)}
        >
          <GoogleIcon className="size-4.5" />
          {t("login.google")}
        </Button>
      )}
    </div>
  );
}
