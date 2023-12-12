export function maskObjectFields(
  obj: Record<string, unknown>,
  maskedFields: string[],
  mask = '*************',
): Record<string, unknown> {
  const maskedObj: Record<string, unknown> = {};

  if (obj) {
    Object.entries(obj).forEach(([key, value]) => {
      maskedObj[key] = maskedFields.includes(key) ? mask : value;
    });
  }

  return maskedObj;
}
