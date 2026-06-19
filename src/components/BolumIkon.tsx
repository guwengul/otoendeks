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

// Sedan yan silüet — 24×24 viewBox, diğer ikonlarla aynı boyut
export function IkonArac(props: Props) {
  return (
    <Base {...props}>
      {/* gövde üst hattı: ön tampon → kaput → ön cam → tavan → arka cam → bagaj → arka tampon */}
      <path d="M1 13.5 L4 12 L9 9 L12 7 H17 L21 11 L23 12 V17" />
      <path d="M1 13.5 V17" />
      {/* zemin: ön tampon-tekerlek, arası, arka tekerlek-tampon */}
      <path d="M1 17 H4.5" />
      <path d="M9.5 17 H14.5" />
      <path d="M19.5 17 H23" />
      {/* ön tekerlek */}
      <circle cx="7" cy="17" r="2.5" />
      {/* arka tekerlek */}
      <circle cx="17" cy="17" r="2.5" />
      {/* cam alanı */}
      <path d="M10 9.5 L12.5 7.5 H16.5 L20 11 H10 Z" />
    </Base>
  );
}

export function IkonPiyasa(props: Props) {
  return (
    <Base {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </Base>
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
