"use client";

export default function GymnastSuccessAnimation({ active }) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <span className="gymnast-seq gymnast-seq-1 fixed top-[42%] text-5xl md:text-6xl select-none">
        🤸‍♀️
      </span>
      <span className="gymnast-seq gymnast-seq-2 fixed top-[42%] text-5xl md:text-6xl select-none">
        🤸‍♂️
      </span>
    </div>
  );
}
