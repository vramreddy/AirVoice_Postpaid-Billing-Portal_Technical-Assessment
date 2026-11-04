export const rupee = v =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(Number(v) || 0);

export const day = d =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

export const month = d =>
  new Date(d).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

export const msg = e =>
  e.response?.data?.message || 'Unable to complete your request. Please try again.';

