import { describe, expect, it } from 'vitest';

import { formatBs, usdToBs } from '../pricing';

describe('usdToBs', () => {
  it('converts USD to Bs at rate 600', () => {
    expect(usdToBs(1.23)).toBe(738);
  });
});

describe('formatBs', () => {
  it('formats with es-VE locale', () => {
    expect(formatBs(1)).toMatch(/600/);
  });
});
