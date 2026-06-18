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

// Sedan silüeti — geniş görünüm için 40x22 viewBox
export function IkonArac({ size = 20, className }: Props) {
  return (
    <svg
      width={Math.round(size * 1.8)}
      height={size}
      viewBox="0 0 40 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* ön tekerlek */}
      <circle cx="10" cy="17" r="3.5" />
      {/* arka tekerlek */}
      <circle cx="30" cy="17" r="3.5" />
      {/* gövde: ön tampon → kaput → ön cam → tavan → arka cam → bagaj → arka tampon */}
      <path d="M1 17V14L5 13 15 8h11l8 6v3H1z" />
      {/* iç cam bölümü */}
      <path d="M16 8.5V14h10l-2-5.5" />
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
