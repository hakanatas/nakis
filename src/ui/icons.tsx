import type { SVGProps } from 'react';
import type { StitchType, Tool } from '../core/types';

export interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const UndoIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8.5 6.5 4 11l4.5 4.5" />
    <path d="M4 11h9.5a5 5 0 0 1 0 10H10" />
  </svg>
);

export const RedoIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m15.5 6.5 4.5 4.5-4.5 4.5" />
    <path d="M20 11h-9.5a5 5 0 0 0 0 10H14" />
  </svg>
);

export const SaveIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v5h7V3" />
    <rect x="8" y="13" width="8" height="8" />
  </svg>
);

export const ExportIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v11" />
    <path d="m8 10 4 4 4-4" />
    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </svg>
);

export const ResetIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 3.5v5h5" />
    <path d="M12 8v4.5l3 1.8" />
  </svg>
);

export const TemplatesIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <path d="M17 13.5v7M13.5 17h7" />
  </svg>
);

export const FitIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </svg>
);

export const PlusIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14" />
  </svg>
);

export const SettingsIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2.2" />
    <circle cx="10" cy="17" r="2.2" />
  </svg>
);

export const CloseIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const EyedropperIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m14.5 6.5 3 3" />
    <path d="M17 3.5a2.1 2.1 0 0 1 3 3l-2.5 2.5-3-3z" />
    <path d="m14.5 9.5-8 8L4 20l2.5-2.5 8-8" />
    <path d="M12 7.5l4.5 4.5" />
  </svg>
);

export const PaletteIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h1.5a4.5 4.5 0 0 0 4.5-4.5C21 7.5 17 3 12 3z" />
    <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const NeedleIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 3.5v14.2l3.6-3.4 2.4 5.5 2.6-1.2-2.5-5.3h5z" />
  </svg>
);

export const EraserIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m14.5 4.5 5 5L10 19H6.2l-2.7-2.7a1.5 1.5 0 0 1 0-2.1z" />
    <path d="m8 10.5 5.5 5.5" />
    <path d="M10 19h10" />
  </svg>
);

export const HandIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9 11V4.8a1.4 1.4 0 0 1 2.8 0V10" />
    <path d="M11.8 9.6V3.9a1.4 1.4 0 0 1 2.8 0v6.2" />
    <path d="M14.6 10V5.2a1.4 1.4 0 0 1 2.8 0v8.3c0 3.9-2.6 7-6.5 7-2.9 0-4.4-1.5-5.7-3.8L3 12.6a1.4 1.4 0 0 1 2.4-1.4L7 13.4V6.6a1.4 1.4 0 0 1 2.8 0" />
  </svg>
);

export const ZoomIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);

export const LeafIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M20 4c-8 0-14 4-15.5 11.5C4.2 17 4 18.5 4 20c1.5 0 3-.2 4.5-.5C16 18 20 12 20 4z" />
    <path d="M4 20c3-5 7-9 12-12" />
  </svg>
);

export const TOOL_ICONS: Record<Tool, (p: IconProps) => JSX.Element> = {
  needle: NeedleIcon,
  eraser: EraserIcon,
  pan: HandIcon,
  zoom: ZoomIcon,
  eyedropper: EyedropperIcon,
};

interface GlyphProps {
  type: StitchType;
  width?: number;
  height?: number;
}

/** Small illustrative glyph for each stitch type (used in lists and the mobile bar). */
export function StitchGlyph({ type, width = 64, height = 32 }: GlyphProps) {
  const props: SVGProps<SVGSVGElement> = {
    width,
    height,
    viewBox: '0 0 64 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (type) {
    case 'running':
      return (
        <svg {...props} strokeWidth={4.2}>
          <path d="M5 16h12M26 16h12M47 16h12" />
        </svg>
      );
    case 'back':
      return (
        <svg {...props} strokeWidth={4.6}>
          <path d="M5 16h14M23 16h14M41 16h14" />
        </svg>
      );
    case 'cross':
      return (
        <svg {...props} strokeWidth={3.6}>
          <path d="m5 8 14 16M19 8 5 24M25 8l14 16M39 8 25 24M45 8l14 16M59 8 45 24" />
        </svg>
      );
    case 'chain':
      return (
        <svg {...props} strokeWidth={3.4}>
          <ellipse cx="14" cy="16" rx="11" ry="7" />
          <ellipse cx="32" cy="16" rx="11" ry="7" />
          <ellipse cx="50" cy="16" rx="11" ry="7" />
        </svg>
      );
    case 'satin':
      return (
        <svg {...props} strokeWidth={1.6}>
          <defs>
            <clipPath id="satin-clip">
              <path d="M20 4h24a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H20a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5z" />
            </clipPath>
          </defs>
          <path
            d="M20 4h24a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H20a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5z"
            fill="currentColor"
            stroke="none"
          />
          <g clipPath="url(#satin-clip)" stroke="rgba(255,255,255,0.45)">
            <path d="M14 10 26 2M14 15l17-11M14 20 36 6M16 25 44 7M20 29 48 11M24 32 50 15M30 32l20-13M36 32l14-9" />
          </g>
        </svg>
      );
    case 'french-knot':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <circle cx="24" cy="11" r="3.6" />
          <circle cx="36" cy="8" r="3.6" />
          <circle cx="42" cy="18" r="3.6" />
          <circle cx="30" cy="22" r="3.6" />
          <circle cx="20" cy="22" r="3.2" />
        </svg>
      );
    case 'lazy-daisy':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} cx="32" cy="7" rx="3.4" ry="8.5" transform={`rotate(${deg} 32 16)`} />
          ))}
          <circle cx="32" cy="16" r="2.4" fill="#fdfcfa" />
        </svg>
      );
  }
}

/** Embroidery hoop logo. */
export function Logo({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="hoop-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9a374" />
          <stop offset="1" stopColor="#9e7a4f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="34" r="26" fill="#f1ebdf" />
      <circle cx="32" cy="34" r="26" fill="none" stroke="url(#hoop-wood)" strokeWidth="5" />
      <circle cx="32" cy="34" r="22" fill="none" stroke="#b08f62" strokeWidth="1.2" opacity="0.6" />
      <rect x="27" y="2" width="10" height="9" rx="2" fill="#a78354" />
      <rect x="30" y="0.5" width="4" height="4" rx="1" fill="#7f6240" />
      <path
        d="M32 47c-1-8-4-13-8-16M32 47c1-8 4-13 8-16"
        stroke="#5f8a49"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M32 47c0-6 1-10 2-13" stroke="#5f8a49" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <ellipse cx="22" cy="36" rx="4.5" ry="2.6" transform="rotate(-35 22 36)" fill="#6f9a4f" />
      <ellipse cx="42" cy="36" rx="4.5" ry="2.6" transform="rotate(35 42 36)" fill="#6f9a4f" />
      <circle cx="24" cy="26" r="4.2" fill="#e0837f" />
      <circle cx="40" cy="26" r="4.2" fill="#e0837f" />
      <circle cx="32" cy="22" r="4.6" fill="#d9706c" />
      <circle cx="32" cy="22" r="1.6" fill="#f2c33d" />
    </svg>
  );
}
