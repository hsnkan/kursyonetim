const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconNfc({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h2M7 13h4" />
      <path d="M15 9.5a2.5 2.5 0 010 5" />
    </svg>
  );
}

export function IconStudents({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1" />
      <path d="M16 11h5M18.5 8.5v5" />
    </svg>
  );
}

export function IconAnnounce({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M4 11v2a2 2 0 002 2h1l4 3V6L7 9H6a2 2 0 00-2 2z" />
      <path d="M16 8a4 4 0 010 8" />
      <path d="M18 6v12" />
    </svg>
  );
}

export function IconReports({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M4 19V5a1 1 0 011-1h14a1 1 0 011 1v14" />
      <path d="M8 17V11M12 17V7M16 17v-4" />
    </svg>
  );
}

export function IconFinance({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h2M10 15h4" />
    </svg>
  );
}

export function IconAudit({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconProfile({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconDev({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M10 8l-4 4 4 4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M16 4l-4 16" />
    </svg>
  );
}

export function IconLogout({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...iconProps}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
