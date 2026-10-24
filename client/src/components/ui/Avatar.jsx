import { useState } from 'react';
import { initials } from '../../utils/formatters.js';

// Shows the user's photo, or their initials if there is no photo or it fails to load.
export default function Avatar({ name, src, size = 40, className = '' }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.38)) };

  if (src && !failed) {
    return (
      <span className={`avatar ${className}`} style={style}>
        <img src={src} alt={`${name}'s profile photo`} onError={() => setFailed(true)} />
      </span>
    );
  }
  return (
    <span className={`avatar ${className}`} style={style} role="img" aria-label={name}>
      {initials(name)}
    </span>
  );
}
