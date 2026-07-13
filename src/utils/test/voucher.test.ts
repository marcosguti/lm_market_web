import { describe, expect, it } from 'vitest';

import { normalizeVoucherText } from '../voucher';

describe('normalizeVoucherText', () => {
  it('normalizes CRLF and trims lines', () => {
    expect(normalizeVoucherText('  linea1\r\nlinea2  \n')).toBe('linea1\nlinea2');
  });

  it('returns empty string for blank input', () => {
    expect(normalizeVoucherText('   \n  ')).toBe('');
  });

  it('collapses multiple spaces within a line to a single space', () => {
    expect(normalizeVoucherText('<UT>          DUPLICADO</UT>')).toBe('<UT> DUPLICADO</UT>');
    expect(normalizeVoucherText('MONTO BS.  :5.172,00')).toBe('MONTO BS. :5.172,00');
  });
});
