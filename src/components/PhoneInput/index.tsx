import 'react-phone-number-input/style.css';

import type { Country } from 'react-phone-number-input';

import PhoneInputWithCountry from 'react-phone-number-input';

import { DEFAULT_PHONE_COUNTRY } from '../../utils/phone';

export interface PhoneInputProps {
  disabled?: boolean;
  id?: string;
  onChange?: (value: string | undefined) => void;
  value?: string;
}

const PhoneInput = ({ disabled, id, onChange, value }: PhoneInputProps) => {
  return (
    <PhoneInputWithCountry
      className="phone-input-antd"
      defaultCountry={DEFAULT_PHONE_COUNTRY as Country}
      disabled={disabled}
      id={id}
      international
      onChange={(next) => onChange?.(next ?? undefined)}
      value={value}
    />
  );
};

export default PhoneInput;
