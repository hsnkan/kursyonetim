"use client";

/** 2FA başarı animasyonu — toplam 3 sn, kız önce, erkek 0.72 sn sonra */
export const GYMNAST_ANIM_MS = 3100;

export default function GymnastSuccessAnimation({ active }) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <span className="gymnast-seq gymnast-seq-1 fixed left-0 top-[33%] text-7xl md:text-8xl select-none leading-none">
        🤸‍♀️
      </span>
      <span className="gymnast-seq gymnast-seq-2 fixed left-0 top-[49%] text-7xl md:text-8xl select-none leading-none">
        🤸‍♂️
      </span>
    </div>
  );
}
