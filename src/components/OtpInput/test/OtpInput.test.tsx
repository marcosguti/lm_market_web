import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OTP_CELL_SIZE_PX, OTP_DIGIT_COUNT } from '../../../constants/formTheme';
import { OtpInput } from '../index';

describe('OtpInput', () => {
  it('renders OTP cells with lm-otp class for 32x32 styling', () => {
    const { container } = render(<OtpInput />);

    const root = container.querySelector('.lm-otp');
    expect(root).toBeInTheDocument();
    expect(container.querySelectorAll('.ant-otp-input')).toHaveLength(OTP_DIGIT_COUNT);
  });

  it('uses text inputs without number spinners', () => {
    const { container } = render(<OtpInput />);

    const inputs = container.querySelectorAll<HTMLInputElement>('.ant-otp-input');
    inputs.forEach((input) => {
      expect(input.type).toBe('text');
      expect(input.inputMode).toBe('numeric');
    });
  });

  it('onChange only emits digits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<OtpInput onChange={onChange} />);

    const firstInput = container.querySelector<HTMLInputElement>('.ant-otp-input');
    expect(firstInput).not.toBeNull();

    await user.type(firstInput!, 'a1b');

    const lastCall = onChange.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toMatch(/^\d*$/);
    expect(lastCall).toContain('1');
  });

  it('applies fixed 32px inline styles to each cell', () => {
    const { container } = render(<OtpInput />);

    const inputs = container.querySelectorAll<HTMLInputElement>('.ant-otp-input');
    expect(inputs).toHaveLength(OTP_DIGIT_COUNT);
    inputs.forEach((input) => {
      expect(input.style.width).toBe(`${OTP_CELL_SIZE_PX}px`);
      expect(input.style.height).toBe(`${OTP_CELL_SIZE_PX}px`);
      expect(input.style.flex).toBe(`0 0 ${OTP_CELL_SIZE_PX}px`);
    });
  });

  it('keeps the OTP root from stretching to full width', () => {
    const { container } = render(<OtpInput />);

    const root = container.querySelector<HTMLElement>('.lm-otp');
    expect(root?.style.width).toBe('fit-content');
    expect(root?.style.maxWidth).toBe('none');
  });
});
