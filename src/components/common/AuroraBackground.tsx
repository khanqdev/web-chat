/** 3 mảng màu tròn làm mờ phía sau nội dung (xanh dương, tím, ngọc) */
export function AuroraBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute top-[8%] left-[20%] size-[min(520px,90vw)] rounded-full bg-(--blob-1) blur-[100px]" />
      <div className="absolute top-[38%] left-[48%] size-[min(480px,85vw)] rounded-full bg-(--blob-2) blur-[100px]" />
      <div className="absolute top-[58%] left-[33%] size-[min(340px,70vw)] rounded-full bg-(--blob-3) blur-[90px]" />
    </div>
  )
}
