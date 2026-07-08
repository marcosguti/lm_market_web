import { describe, expect, it } from 'vitest';

import { OTP_CELL_SIZE_PX, OTP_DIGIT_COUNT } from '../formTheme';

describe('formTheme', () => {
  it('defines OTP cell size matching mobile', () => {
    expect(OTP_CELL_SIZE_PX).toBe(32);
  });

  it('defines OTP digit count matching mobile', () => {
    expect(OTP_DIGIT_COUNT).toBe(4);
  });
});
