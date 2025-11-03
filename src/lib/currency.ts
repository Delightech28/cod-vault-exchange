// Currency conversion rates (USD as base)
const CURRENCY_RATES: Record<string, { rate: number; symbol: string; code: string }> = {
  "United States": { rate: 1, symbol: "$", code: "USD" },
  "Nigeria": { rate: 1650, symbol: "₦", code: "NGN" },
  "United Kingdom": { rate: 0.79, symbol: "£", code: "GBP" },
  "Canada": { rate: 1.36, symbol: "C$", code: "CAD" },
  "Australia": { rate: 1.53, symbol: "A$", code: "AUD" },
  "India": { rate: 83.12, symbol: "₹", code: "INR" },
  "Germany": { rate: 0.92, symbol: "€", code: "EUR" },
  "France": { rate: 0.92, symbol: "€", code: "EUR" },
  "Japan": { rate: 149.50, symbol: "¥", code: "JPY" },
  "South Africa": { rate: 18.85, symbol: "R", code: "ZAR" },
  "Brazil": { rate: 4.98, symbol: "R$", code: "BRL" },
  "Mexico": { rate: 17.15, symbol: "$", code: "MXN" },
  "Kenya": { rate: 129.50, symbol: "KSh", code: "KES" },
  "Ghana": { rate: 12.05, symbol: "GH₵", code: "GHS" },
  // Add more countries as needed
};

export const getCurrencyInfo = (country: string | null | undefined) => {
  if (!country || !CURRENCY_RATES[country]) {
    return CURRENCY_RATES["United States"]; // Default to USD
  }
  return CURRENCY_RATES[country];
};

export const convertPrice = (usdPrice: number, country: string | null | undefined): number => {
  const currencyInfo = getCurrencyInfo(country);
  return usdPrice * currencyInfo.rate;
};

export const formatPrice = (usdPrice: number, country: string | null | undefined): string => {
  const currencyInfo = getCurrencyInfo(country);
  const convertedPrice = convertPrice(usdPrice, country);
  
  // Format based on currency code
  if (currencyInfo.code === "JPY") {
    // Japanese Yen doesn't use decimals
    return `${currencyInfo.symbol}${Math.round(convertedPrice).toLocaleString()}`;
  }
  
  return `${currencyInfo.symbol}${convertedPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
