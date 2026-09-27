const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function formatBRL(value: number): string {
  return BRL_FORMATTER.format(value);
}

export function priceParts(value: number): {
  currency: string;
  whole: string;
  fraction: string;
} {
  const parts = BRL_FORMATTER.formatToParts(value);
  const join = (types: Intl.NumberFormatPartTypes[]) =>
    parts
      .filter((part) => types.includes(part.type))
      .map((part) => part.value)
      .join("");
  return {
    currency: join(["currency"]),
    whole: join(["integer", "group"]),
    fraction: join(["decimal", "fraction"]),
  };
}

export function formatInstallments(count: number, value: number): string {
  return `ou até ${count}x de ${formatBRL(value)}`;
}
