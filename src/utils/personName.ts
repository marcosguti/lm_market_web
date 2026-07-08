export const PERSON_NAME_PATTERN = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+$/;

export function isValidPersonName(value?: string | null): boolean {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }

  return PERSON_NAME_PATTERN.test(trimmed);
}
