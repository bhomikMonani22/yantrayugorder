/**
 * Soft Tech design tokens — single source of truth for both apps.
 * White-label: re-theming a new distributor = edit this file only.
 */
export const tokens = {
  color: {
    bg:            '#FAF6F0', // warm cream / alabaster (never pure white)
    surface:       '#FFFFFF', // raised cards sit slightly above the cream bg
    ink:           '#1E1E1E', // primary off-black text
    inkSoft:       '#8C857B', // warm grey, subdued text
    charcoal1:     '#2C2A29', // dark accent gradient start
    charcoal2:     '#1A1918', // dark accent gradient end

    // Signature "Sunset" gradient stops (logo, key CTAs, totals, active states)
    sunset1:       '#FF8C42', // orange
    sunset2:       '#FF5E7E', // pink
    sunset3:       '#B57BFF', // purple

    // Functional matte pastels
    pink:          '#FFC9D6', // billing / alerts
    lavender:      '#CFC2FF', // media
    mint:          '#A8E3C2', // inventory / success
    sky:           '#B0D6FF', // analytics / data
    gold:          '#FFDD8A', // customer / warning
  },
  gradient: {
    sunset:   'linear-gradient(135deg, #FF8C42 0%, #FF5E7E 50%, #B57BFF 100%)',
    charcoal: 'linear-gradient(160deg, #2C2A29 0%, #1A1918 100%)',
  },
  font: {
    display: "'Playfair Display', Georgia, serif", // high-contrast serif
    body:    "'Inter', system-ui, sans-serif",       // geometric sans
  },
  radius: {
    card: '28px',   // 24-32px large cards
    tile: '12px',   // small icon tiles
    pill: '9999px', // fully pill-shaped buttons
  },
  shadow: {
    // Glassmorphism-lite: soft, wide, slightly tinted. No harsh dark drops.
    soft:  '0 8px 30px rgba(44,42,41,0.06)',
    lift:  '0 14px 40px rgba(44,42,41,0.10)',
    sunset:'0 10px 30px rgba(255,94,126,0.28)',
  },
  // iPhone-first sizing floors
  touch: {
    min: '44px',  // Apple HIG minimum hit area
    fab: '64px',  // scan FAB
    row: '64px',  // catalogue list rows
  },
} as const;

export type Tokens = typeof tokens;
