'use client';

export function usePhoneMask() {
  const applyPhoneMask = (value: string): string => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');

    // Limit to 11 digits
    const limited = cleaned.slice(0, 11);

    // Apply mask based on length
    if (limited.length === 0) return '';
    if (limited.length <= 2) return `(${limited}`;
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const removeMask = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  return { applyPhoneMask, removeMask };
}
