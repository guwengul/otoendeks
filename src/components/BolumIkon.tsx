import { type SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 16, className, children, ...rest }: Props) {
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

export function IkonArac(props: Props) {
  return (
    <Base {...props}>
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
      <path d="M1 17v-3l3-7h16l3 7v3H1z" />
      <path d="M5 10h14M8 7l-1 3M16 7l1 3" />
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
