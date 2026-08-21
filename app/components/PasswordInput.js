"use client";

import { useState } from "react";

function EyeOpen({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosed({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.1A10.8 10.8 0 0112 5c6.5 0 10 7 10 7a18.2 18.2 0 01-4.1 5.2" />
      <path d="M6.1 6.1C3.9 7.8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 004.2-.9" />
    </svg>
  );
}

export default function PasswordInput({
  className = "",
  inputClassName = "",
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClassName} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        tabIndex={-1}
      >
        {visible ? <EyeClosed /> : <EyeOpen />}
      </button>
    </div>
  );
}
