import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconGrid(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </svg>
  );
}

export function IconMarkets(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </svg>
  );
}

export function IconActivity(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h3.2l2.1-6 3.4 12 2.2-6H20" />
    </svg>
  );
}

export function IconDocs(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4.5h7.2L19.5 10v9.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z" />
      <path d="M14 4.5V10h5.5" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12a8 8 0 1 1-2.2-5.5" />
      <path d="M20 4.5V9h-4.5" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v9A2.5 2.5 0 0 0 6.5 20h9a2.5 2.5 0 0 0 2.5-2.5V14" />
      <path d="M13 4h7v7M20 4 11 13" />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#121a2b" />
      <rect x="0.6" y="0.6" width="30.8" height="30.8" rx="8.4" stroke="#2ec7c0" strokeOpacity="0.45" />
      <path
        d="M8 22.2 16 7.8l8 14.4h-3.1L16 12.6l-4.9 9.6H8Z"
        fill="#2ec7c0"
      />
      <path d="M12.4 22.2h7.2L16 16.1 12.4 22.2Z" fill="#9ef2e0" />
    </svg>
  );
}
