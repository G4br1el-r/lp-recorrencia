const TWO_DIGITS_PAD = 2;

export function pad(value: number, length = TWO_DIGITS_PAD): string {
  return String(value).padStart(length, "0");
}
