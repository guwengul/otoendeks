import { type SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, className, children, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IkonKasko(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 3 4 6.5v5C4 16.1 7.4 20.5 12 22c4.6-1.5 8-5.9 8-10.5v-5L12 3z" />
      <path d="m9 12 2 2 4-4" />
    </Base>
  );
}

// Sedan yan silüet — 48×24 viewBox (2:1 oran, gerçekçi sedan)
export function IkonArac({ size = 20, className }: Props) {
  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 48 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* dış gövde: ön tampon → kaput eğimi → ön cam → düz tavan → arka cam → bagaj → arka tampon */}
      <path d="M2 15 L7 13 L14 9 L19 7 H29 L36 11 L44 12 L46 15 V21 H40" />
      <path d="M32 21 H16" />
      <path d="M8 21 H2 V15" />
      {/* ön tekerlek */}
      <circle cx="12" cy="17" r="4" />
      {/* arka tekerlek */}
      <circle cx="36" cy="17" r="4" />
      {/* cam alanı + B-pillar */}
      <path d="M15 9.5 L19.5 7.5 H28.5 L34.5 11.5 H15 Z" />
      <line x1="24" y1="7.5" x2="24" y2="11.5" />
    </svg>
  );
}

export function IkonKredi(props: Props) {
  return (
    <Base {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h2m4 0h6" />
    </Base>
  );
}
