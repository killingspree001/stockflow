const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function money(value: number) {
  return currency.format(Number.isFinite(value) ? value : 0);
}
