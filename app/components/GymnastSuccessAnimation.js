"use client";

export default function GymnastSuccessAnimation({ active }) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <span className="gymnast-runner gymnast-girl fixed left-[30%] top-[38%] text-5xl md:text-6xl select-none">
        🤸‍♀️
      </span>
      <span className="gymnast-runner gymnast-boy fixed left-[58%] top-[40%] text-5xl md:text-6xl select-none">
        🤸‍♂️
      </span>
    </div>
  );
}
