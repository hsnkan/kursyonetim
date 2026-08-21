"use client";

/** 2FA başarı animasyonu — toplam 3 sn, arka arkaya yuvarlanarak */
export const GYMNAST_ANIM_MS = 3100;

export default function GymnastSuccessAnimation({ active }) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <span
        className="gymnast-seq gymnast-seq-1 gymnast-emoji fixed left-0 select-none"
        style={{ top: "calc(50% - 8.333vw)" }}
        aria-hidden
      >
        🤸‍♀️
      </span>
      <span
        className="gymnast-seq gymnast-seq-2 gymnast-emoji fixed left-0 select-none"
        style={{ top: "calc(50% - 8.333vw)" }}
        aria-hidden
      >
        🤸‍♂️
      </span>
    </div>
  );
}
