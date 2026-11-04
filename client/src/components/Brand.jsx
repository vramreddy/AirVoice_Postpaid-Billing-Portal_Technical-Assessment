import React from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

export function Brand({ light = false }) {
  return (
    <Link to="/" className={'brand ' + (light ? 'brand-light' : '')}>
      <span className="brand-mark">
        <Radio size={20} strokeWidth={2.5} />
      </span>
      <span>
        Air<span className="brand-em">Voice</span>
      </span>
    </Link>
  );
}

export default Brand;

