import { Link } from 'react-router-dom';

const BrandLogo = ({ to = '/', className = '' }) => (
  <Link to={to} className={`brand-logo ${className}`.trim()} aria-label="Go to LOBBy campus market home">
    <span className="brand-logo__mark" aria-hidden="true">
      <svg className="brand-logo__svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* market lane */}
        <path d="M4 33.5h32" className="brand-logo__lane" strokeWidth="1.5" strokeLinecap="round" />

        {/* left stall */}
        <path d="M5.5 22.5 9.5 18.5 13.5 22.5V31.5H5.5V22.5Z" className="brand-logo__awning" />
        <path d="M6.5 24h6M6.5 25.5h6" className="brand-logo__stripe" strokeWidth="0.7" />
        <rect x="6" y="22.5" width="7.5" height="9" rx="0.6" className="brand-logo__stall" />

        {/* center stall */}
        <path d="M14.5 19.5 20 14.5 25.5 19.5V31.5H14.5V19.5Z" className="brand-logo__awning brand-logo__awning--main" />
        <path d="M15.5 21h9M15.5 22.5h9" className="brand-logo__stripe" strokeWidth="0.8" />
        <rect x="15" y="19.5" width="10" height="12" rx="0.6" className="brand-logo__stall brand-logo__stall--main" />
        <rect x="17.2" y="23.5" width="2.2" height="3.5" rx="0.3" className="brand-logo__window" />
        <rect x="21.2" y="23.5" width="2.2" height="3.5" rx="0.3" className="brand-logo__window" />

        {/* right stall */}
        <path d="M26.5 22.5 30.5 18.5 34.5 22.5V31.5H26.5V22.5Z" className="brand-logo__awning" />
        <path d="M27.5 24h6M27.5 25.5h6" className="brand-logo__stripe" strokeWidth="0.7" />
        <rect x="27" y="22.5" width="7.5" height="9" rx="0.6" className="brand-logo__stall" />
      </svg>
    </span>
    <span className="brand-logo__copy">
      <span className="brand-logo__wordmark">
        LOB<span className="brand-logo__accent">By</span>
      </span>
      <span className="brand-logo__tagline">Campus Market</span>
    </span>
  </Link>
);

export default BrandLogo;
