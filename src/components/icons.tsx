type IconProps = { className?: string };

const COMMON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
};

export function PhoneIcon({ className = "" }: IconProps) {
  return (
    <svg {...COMMON} className={className}>
      <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function ArrowRight({ className = "" }: IconProps) {
  return (
    <svg {...COMMON} strokeWidth={1.8} className={className}>
      <path d="M5 12h14m-6-7 7 7-7 7" />
    </svg>
  );
}

export function ArrowDown({ className = "" }: IconProps) {
  return (
    <svg {...COMMON} strokeWidth={1.8} className={className}>
      <path d="M12 5v14m-7-6 7 7 7-7" />
    </svg>
  );
}
