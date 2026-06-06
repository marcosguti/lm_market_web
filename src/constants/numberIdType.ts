export const NUMBER_ID_TYPE_OPTIONS = [
  { label: 'V', value: 'V' },
  { label: 'E', value: 'E' },
  { label: 'P', value: 'P' },
  { label: 'J', value: 'J' },
] as const;

export type NumberIdType = (typeof NUMBER_ID_TYPE_OPTIONS)[number]['value'];
