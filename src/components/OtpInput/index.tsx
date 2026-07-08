import { Input } from 'antd';
import type { OTPProps } from 'antd/es/input/OTP';
import type { CSSProperties } from 'react';

import { OTP_CELL_SIZE_PX, OTP_DIGIT_COUNT } from '../../constants/formTheme';

export type OtpInputProps = Omit<OTPProps, 'length' | 'type'> & {
  length?: number;
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const otpRootStyle: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  maxWidth: 'none',
  gap: 8,
};

const otpCellStyle: CSSProperties = {
  width: OTP_CELL_SIZE_PX,
  height: OTP_CELL_SIZE_PX,
  minWidth: OTP_CELL_SIZE_PX,
  maxWidth: OTP_CELL_SIZE_PX,
  flex: `0 0 ${OTP_CELL_SIZE_PX}px`,
  padding: 0,
  textAlign: 'center',
  fontSize: 16,
  fontWeight: 600,
  boxSizing: 'border-box',
};

/** Four-digit OTP input with 32x32 cells (see `.lm-otp` in index.css). */
export const OtpInput = ({
  length = OTP_DIGIT_COUNT,
  classNames,
  formatter,
  inputMode = 'numeric',
  onChange,
  styles,
  ...props
}: OtpInputProps) => (
  <Input.OTP
    classNames={{
      input: 'lm-otp-cell',
      root: 'lm-otp',
      ...classNames,
    }}
    formatter={(value) => digitsOnly(formatter ? formatter(value) : value)}
    inputMode={inputMode}
    length={length}
    rootClassName="lm-otp"
    styles={{
      input: { ...otpCellStyle, ...styles?.input },
      root: { ...otpRootStyle, ...styles?.root },
      separator: styles?.separator,
    }}
    type="text"
    onChange={(value) => onChange?.(digitsOnly(value))}
    {...props}
  />
);
