const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconNfc({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
      <path d="M7 12h3" />
      <path d="M14 10.5a1.5 1.5 0 010 3" />
      <path d="M4 12h0.01M20 12h0.01" />
    </svg>
  );
}

export function IconStudents({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <circle cx="9" cy="7" r="3.5" />
      <path d="M3 20v-0.5a5.5 5.5 0 0111 0V20" />
      <circle cx="17.5" cy="8.5" r="2.5" />
      <path d="M15 20v-0.5a3.5 3.5 0 017 0V20" />
    </svg>
  );
}

export function IconAnnounce({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M4 10v4a2 2 0 002 2h1l3.5 2.5V5.5L7 8H5a2 2 0 00-2 2z" />
      <path d="M15.5 8.5a3.5 3.5 0 010 7" />
      <path d="M19 7v10" />
    </svg>
  );
}

export function IconReports({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 16V11M12 16V8M15 16v-5" />
      <path d="M6 8h12" opacity="0.5" />
    </svg>
  );
}

export function IconFinance({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h.01M11 15h2" />
      <path d="M16 4v3M8 4v3" />
    </svg>
  );
}

export function IconAudit({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M12 8v5l3 2" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" opacity="0.35" />
    </svg>
  );
}

export function IconProfile({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20v-1a7 7 0 0114 0v1" />
      <path d="M16 5l2-1M8 5L6 4" opacity="0.45" />
    </svg>
  );
}

export function IconDev({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M8 9l-4 3 4 3" />
      <path d="M16 9l4 3-4 3" />
      <path d="M13 5l-2 14" />
    </svg>
  );
}

export function IconLogout({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12H9" />
      <path d="M11 20H6a2 2 0 01-2-2V6a2 2 0 012-2h5" />
    </svg>
  );
}
