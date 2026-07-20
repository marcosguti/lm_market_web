import { describe, expect, it } from 'vitest';

import {
  formatSuccessfulPaymentVoucher,
  normalizeVoucherText,
  SUCCESSFUL_PAYMENT_VOUCHER_PREFIX,
} from '../voucher';

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

describe('formatSuccessfulPaymentVoucher', () => {
  it('prefixes normalized voucher with success message', () => {
    expect(formatSuccessfulPaymentVoucher('<UT>          DUPLICADO</UT>\nBANCO')).toBe(
      `${SUCCESSFUL_PAYMENT_VOUCHER_PREFIX}\n\n<UT> DUPLICADO</UT>\nBANCO`,
    );
  });

  it('returns only success message when voucher is blank', () => {
    expect(formatSuccessfulPaymentVoucher('   \n  ')).toBe(SUCCESSFUL_PAYMENT_VOUCHER_PREFIX);
  });
});
