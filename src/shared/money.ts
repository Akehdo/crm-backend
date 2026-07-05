type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

export type MoneyValue = number | string | DecimalLike;

export function toMoneyNumber(value: MoneyValue): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  if (typeof value.toNumber === "function") {
    return value.toNumber();
  }

  return Number(value.toString());
}
