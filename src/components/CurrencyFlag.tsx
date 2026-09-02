import React from 'react';

interface CurrencyFlagProps {
  currency?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * High-definition Vector SVG Country/Currency Flag component.
 * Ensures consistent, colorful flags across Windows, Linux, Android, macOS and iOS,
 * avoiding the Windows/Linux emoji fallback which only displays regional indicator letters (e.g. "SE", "EU").
 */
export const CurrencyFlag: React.FC<CurrencyFlagProps> = ({
  currency = 'EUR',
  className = '',
  size = 'sm',
}) => {
  const code = (currency || 'EUR').trim().toUpperCase();

  const sizeClasses = {
    xs: 'w-3.5 h-2.5 min-w-[14px]',
    sm: 'w-4 h-3 min-w-[16px]',
    md: 'w-5 h-3.5 min-w-[20px]',
    lg: 'w-6 h-4.5 min-w-[24px]',
  }[size];

  const baseSvgProps: React.SVGProps<SVGSVGElement> = {
    className: `inline-block shrink-0 rounded-[2px] shadow-2xs ring-1 ring-black/10 dark:ring-white/20 overflow-hidden ${sizeClasses} ${className}`,
    viewBox: '0 0 640 480',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  switch (code) {
    case 'EUR':
      // European Union Flag (12 golden stars on blue)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#003399" />
          <g fill="#ffcc00" transform="translate(320,240) scale(24)">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x = Math.sin(rad) * 6.5;
              const y = -Math.cos(rad) * 6.5;
              return (
                <polygon
                  key={angle}
                  points="0,-1 0.588,0.809 -0.951,-0.309 0.951,-0.309 -0.588,0.809"
                  transform={`translate(${x},${y}) scale(0.9)`}
                />
              );
            })}
          </g>
        </svg>
      );

    case 'SEK':
      // Sweden Flag (Yellow Nordic cross on blue)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#006AA7" />
          <rect width="80" height="480" x="200" fill="#FECC00" />
          <rect width="640" height="80" y="200" fill="#FECC00" />
        </svg>
      );

    case 'USD':
      // United States Flag (Red/white stripes & blue canton with stars)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#B22234" />
          {[1, 3, 5, 7, 9, 11].map((i) => (
            <rect key={i} y={(i * 480) / 13} width="640" height={480 / 13} fill="#FFFFFF" />
          ))}
          <rect width="260" height={(7 * 480) / 13} fill="#3C3B6E" />
          <g fill="#FFFFFF">
            {[0, 1, 2, 3, 4].map((row) =>
              [0, 1, 2, 3, 4, 5].map((col) => (
                <polygon
                  key={`star-${row}-${col}`}
                  points="0,-6 1.76,5.42 -4.76,-1.85 4.76,-1.85 -1.76,5.42"
                  transform={`translate(${25 + col * 42}, ${25 + row * 45}) scale(0.8)`}
                />
              ))
            )}
          </g>
        </svg>
      );

    case 'GBP':
      // United Kingdom Flag (Union Jack)
      return (
        <svg {...baseSvgProps}>
          <clipPath id="gbp-clip">
            <rect width="640" height="480" />
          </clipPath>
          <g clipPath="url(#gbp-clip)">
            <rect width="640" height="480" fill="#012169" />
            <path d="M0 0 L640 480 M640 0 L0 480" stroke="#FFFFFF" strokeWidth="80" />
            <path d="M0 0 L640 480 M640 0 L0 480" stroke="#C8102E" strokeWidth="48" />
            <path d="M320 0 V480 M0 240 H640" stroke="#FFFFFF" strokeWidth="120" />
            <path d="M320 0 V480 M0 240 H640" stroke="#C8102E" strokeWidth="72" />
          </g>
        </svg>
      );

    case 'NOK':
      // Norway Flag (Red with white and dark blue Nordic cross)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#BA0C2F" />
          <rect width="120" height="480" x="180" fill="#FFFFFF" />
          <rect width="640" height="120" y="180" fill="#FFFFFF" />
          <rect width="60" height="480" x="210" fill="#00205B" />
          <rect width="640" height="60" y="210" fill="#00205B" />
        </svg>
      );

    case 'CHF':
      // Switzerland Flag (Red with centered white cross)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#D52B1E" />
          <rect width="100" height="280" x="270" y="100" fill="#FFFFFF" rx="4" />
          <rect width="280" height="100" x="180" y="190" fill="#FFFFFF" rx="4" />
        </svg>
      );

    case 'CAD':
      // Canada Flag (Red, white, red with maple leaf)
      return (
        <svg {...baseSvgProps}>
          <rect width="160" height="480" fill="#FF0000" />
          <rect width="320" height="480" x="160" fill="#FFFFFF" />
          <rect width="160" height="480" x="480" fill="#FF0000" />
          <path
            d="M320 120 L335 190 L380 170 L360 215 L410 230 L390 260 L400 280 L350 270 L340 310 L330 310 L325 360 L315 360 L310 310 L300 310 L290 270 L240 280 L250 260 L230 230 L280 215 L260 170 L305 190 Z"
            fill="#FF0000"
          />
        </svg>
      );

    case 'AUD':
      // Australia Flag (Blue Ensign with Union Jack and 7-point stars)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#00008B" />
          <g transform="scale(0.5)">
            <rect width="640" height="480" fill="#012169" />
            <path d="M0 0 L640 480 M640 0 L0 480" stroke="#FFFFFF" strokeWidth="80" />
            <path d="M0 0 L640 480 M640 0 L0 480" stroke="#C8102E" strokeWidth="48" />
            <path d="M320 0 V480 M0 240 H640" stroke="#FFFFFF" strokeWidth="120" />
            <path d="M320 0 V480 M0 240 H640" stroke="#C8102E" strokeWidth="72" />
          </g>
          {/* Commonwealth Star */}
          <polygon
            points="0,-35 8,-12 33,-18 17,2 30,22 8,17 0,40 -8,17 -30,22 -17,2 -33,-18 -8,-12"
            fill="#FFFFFF"
            transform="translate(160, 360) scale(0.9)"
          />
          {/* Southern cross stars */}
          <circle cx="480" cy="100" r="14" fill="#FFFFFF" />
          <circle cx="560" cy="180" r="14" fill="#FFFFFF" />
          <circle cx="480" cy="380" r="14" fill="#FFFFFF" />
          <circle cx="400" cy="220" r="14" fill="#FFFFFF" />
          <circle cx="520" cy="270" r="8" fill="#FFFFFF" />
        </svg>
      );

    case 'JPY':
      // Japan Flag (White with red sun)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#FFFFFF" />
          <circle cx="320" cy="240" r="130" fill="#BC002D" />
        </svg>
      );

    case 'TRY':
      // Turkey Flag (Red with white crescent and star)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#E30A17" />
          <circle cx="260" cy="240" r="120" fill="#FFFFFF" />
          <circle cx="290" cy="240" r="96" fill="#E30A17" />
          <polygon
            points="0,-40 11.7, -12 40, -12 17.6, 6 26.5, 33 0, 16 -26.5, 33 -17.6, 6 -40, -12 -11.7, -12"
            fill="#FFFFFF"
            transform="translate(380, 240) rotate(18) scale(0.9)"
          />
        </svg>
      );

    case 'MXN':
      // Mexico Flag (Green, white, red tricolor with emblem)
      return (
        <svg {...baseSvgProps}>
          <rect width="213" height="480" fill="#006847" />
          <rect width="214" height="480" x="213" fill="#FFFFFF" />
          <rect width="213" height="480" x="427" fill="#CE1126" />
          <circle cx="320" cy="240" r="40" fill="#A0522D" opacity="0.8" />
          <circle cx="320" cy="240" r="28" fill="#2E8B57" />
        </svg>
      );

    case 'ARS':
      // Argentina Flag (Light blue, white, light blue with Sun)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="160" fill="#75AADB" />
          <rect width="640" height="160" y="160" fill="#FFFFFF" />
          <rect width="640" height="160" y="320" fill="#75AADB" />
          <circle cx="320" cy="240" r="32" fill="#F6B40E" />
          <circle cx="320" cy="240" r="26" fill="#85340A" opacity="0.3" />
        </svg>
      );

    case 'CLP':
      // Chile Flag (Blue canton with star, white top, red bottom)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="240" fill="#FFFFFF" />
          <rect width="640" height="240" y="240" fill="#D52B1E" />
          <rect width="240" height="240" fill="#0039A6" />
          <polygon
            points="0,-45 13,-14 45,-14 19,7 30,38 0,18 -30,38 -19,7 -45,-14 -13,-14"
            fill="#FFFFFF"
            transform="translate(120, 120) scale(0.9)"
          />
        </svg>
      );

    case 'COP':
      // Colombia Flag (Yellow half, blue quarter, red quarter)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="240" fill="#FCD116" />
          <rect width="640" height="120" y="240" fill="#003893" />
          <rect width="640" height="120" y="360" fill="#CE1126" />
        </svg>
      );

    case 'PEN':
      // Peru Flag (Red, white, red)
      return (
        <svg {...baseSvgProps}>
          <rect width="213" height="480" fill="#D91023" />
          <rect width="214" height="480" x="213" fill="#FFFFFF" />
          <rect width="213" height="480" x="427" fill="#D91023" />
        </svg>
      );

    case 'BRL':
      // Brazil Flag (Green with yellow diamond and blue circle)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#009739" />
          <polygon points="320,50 590,240 320,430 50,240" fill="#FEDD00" />
          <circle cx="320" cy="240" r="105" fill="#012169" />
          <path d="M220,240 Q320,210 420,250" stroke="#FFFFFF" strokeWidth="12" fill="none" />
        </svg>
      );

    case 'PLN':
      // Poland Flag (White top, red bottom)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="240" fill="#FFFFFF" />
          <rect width="640" height="240" y="240" fill="#DC143C" />
        </svg>
      );

    case 'INR':
      // India Flag (Saffron, white, green with Ashoka Chakra)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="160" fill="#FF9933" />
          <rect width="640" height="160" y="160" fill="#FFFFFF" />
          <rect width="640" height="160" y="320" fill="#138808" />
          <circle cx="320" cy="240" r="45" fill="none" stroke="#000080" strokeWidth="8" />
          <circle cx="320" cy="240" r="12" fill="#000080" />
        </svg>
      );

    case 'CNY':
      // China Flag (Red with 5 golden stars)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="480" fill="#DE2910" />
          <polygon
            points="0,-45 13,-14 45,-14 19,7 30,38 0,18 -30,38 -19,7 -45,-14 -13,-14"
            fill="#FFDE00"
            transform="translate(130, 130)"
          />
          <circle cx="230" cy="65" r="10" fill="#FFDE00" />
          <circle cx="270" cy="110" r="10" fill="#FFDE00" />
          <circle cx="270" cy="170" r="10" fill="#FFDE00" />
          <circle cx="230" cy="215" r="10" fill="#FFDE00" />
        </svg>
      );

    case 'GHS':
      // Ghana Flag (Red, yellow, green with black star)
      return (
        <svg {...baseSvgProps}>
          <rect width="640" height="160" fill="#CE1126" />
          <rect width="640" height="160" y="160" fill="#FCD116" />
          <rect width="640" height="160" y="320" fill="#006B3F" />
          <polygon
            points="0,-40 12,-12 40,-12 17,6 26,33 0,16 -26,33 -17,6 -40,-12 -12,-12"
            fill="#000000"
            transform="translate(320, 240) scale(0.9)"
          />
        </svg>
      );

    default:
      // Generic fallback badge with currency symbol and subtle styling
      return (
        <span
          className={`inline-flex items-center justify-center font-bold text-[9px] bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-[2px] ring-1 ring-border ${sizeClasses} ${className}`}
        >
          {code.substring(0, 3)}
        </span>
      );
  }
};
