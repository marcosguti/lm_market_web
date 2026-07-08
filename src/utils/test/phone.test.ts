import { describe, expect, it } from 'vitest';

import { isValidPhone, normalizePhone, parsePhone } from '../phone';

describe('phone utils', () => {
  it('normalizes Venezuelan local numbers', () => {
    expect(normalizePhone('04120765408')).toBe('+584120765408');
  });

  it('validates phone numbers', () => {
    expect(isValidPhone('04120765408')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
  });

  it('parses E.164 numbers', () => {
    expect(parsePhone('+584120765408')).toEqual({
      country: 'VE',
      countryCallingCode: '+58',
      nationalNumber: '4120765408',
    });
  });
});
