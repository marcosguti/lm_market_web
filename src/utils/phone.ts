import { type CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'VE';

export function normalizePhone(
  input: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string | null {
  const trimmed = input?.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed?.isValid()) {
    return null;
  }

  return parsed.format('E.164');
}

export function parsePhone(e164: string): {
  country: CountryCode;
  countryCallingCode: string;
  nationalNumber: string;
} | null {
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed?.isValid()) {
    return null;
  }

  return {
    country: parsed.country ?? DEFAULT_PHONE_COUNTRY,
    countryCallingCode: `+${parsed.countryCallingCode}`,
    nationalNumber: parsed.nationalNumber,
  };
}

export function isValidPhone(
  input: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): boolean {
  return normalizePhone(input, defaultCountry) !== null;
}
