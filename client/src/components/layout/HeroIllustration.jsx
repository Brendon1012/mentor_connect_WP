// Hand-built SVG illustration (no external images): a mentor card, an upcoming
// session and a message, sitting on a rising "progress" path.
export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 400" role="img" aria-labelledby="hero-svg-title" className="hero-svg">
      <title id="hero-svg-title">Illustration of a mentor profile, a scheduled session and a chat message</title>
      <rect x="20" y="20" width="440" height="360" rx="28" fill="#E8F1FB" />
      {/* rising progress path */}
      <path d="M60 330 C 150 320, 190 250, 260 240 S 380 150, 430 90" fill="none" stroke="#1E40AF" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" />
      <circle cx="60" cy="330" r="7" fill="#1E40AF" />
      <circle cx="260" cy="240" r="7" fill="#1E40AF" />
      <circle cx="430" cy="90" r="10" fill="#D4A017" />
      <path d="M424 90l4 4 8-9" stroke="#0B1F3A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* mentor card */}
      <g>
        <rect x="56" y="62" width="220" height="132" rx="16" fill="#fff" stroke="#E2E8F0" />
        <circle cx="96" cy="104" r="22" fill="#0B1F3A" />
        <text x="96" y="110" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="15" fill="#fff">AR</text>
        <rect x="130" y="88" width="110" height="10" rx="5" fill="#0B1F3A" />
        <rect x="130" y="106" width="80" height="8" rx="4" fill="#CBD5E1" />
        <rect x="76" y="142" width="54" height="20" rx="10" fill="#E8F1FB" />
        <rect x="136" y="142" width="62" height="20" rx="10" fill="#E8F1FB" />
        <rect x="204" y="142" width="44" height="20" rx="10" fill="#E8F1FB" />
        <rect x="76" y="170" width="70" height="8" rx="4" fill="#E2E8F0" />
      </g>

      {/* session card */}
      <g>
        <rect x="248" y="168" width="184" height="96" rx="16" fill="#0B1F3A" />
        <rect x="268" y="188" width="40" height="40" rx="10" fill="#D4A017" />
        <rect x="276" y="200" width="24" height="3" rx="1.5" fill="#0B1F3A" />
        <rect x="276" y="208" width="16" height="3" rx="1.5" fill="#0B1F3A" />
        <rect x="320" y="192" width="90" height="9" rx="4.5" fill="#fff" />
        <rect x="320" y="208" width="64" height="7" rx="3.5" fill="#8EA3BF" />
        <rect x="268" y="240" width="142" height="8" rx="4" fill="#1B3254" />
        <rect x="268" y="240" width="96" height="8" rx="4" fill="#D4A017" />
      </g>

      {/* chat bubble */}
      <g>
        <path d="M84 238h120a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14h-86l-20 16v-16h-14a14 14 0 0 1-14-14v-34a14 14 0 0 1 14-14Z" fill="#fff" stroke="#E2E8F0" />
        <rect x="88" y="256" width="104" height="8" rx="4" fill="#1E40AF" />
        <rect x="88" y="272" width="70" height="8" rx="4" fill="#CBD5E1" />
      </g>
    </svg>
  );
}
