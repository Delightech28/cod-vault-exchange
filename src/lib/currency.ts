// Currency info without conversion (prices stored in local currency)
const CURRENCY_INFO: Record<string, { symbol: string; code: string }> = {
  "United States": { symbol: "$", code: "USD" },
  "Nigeria": { symbol: "₦", code: "NGN" },
  "United Kingdom": { symbol: "£", code: "GBP" },
  "Canada": { symbol: "C$", code: "CAD" },
  "Australia": { symbol: "A$", code: "AUD" },
  "India": { symbol: "₹", code: "INR" },
  "Germany": { symbol: "€", code: "EUR" },
  "France": { symbol: "€", code: "EUR" },
  "Japan": { symbol: "¥", code: "JPY" },
  "South Africa": { symbol: "R", code: "ZAR" },
  "Brazil": { symbol: "R$", code: "BRL" },
  "Mexico": { symbol: "$", code: "MXN" },
  "Kenya": { symbol: "KSh", code: "KES" },
  "Ghana": { symbol: "GH₵", code: "GHS" },
  // Add more countries as needed
};

export const getCurrencyInfo = (country: string | null | undefined) => {
  if (!country || !CURRENCY_INFO[country]) {
    return CURRENCY_INFO["United States"]; // Default to USD
  }
  return CURRENCY_INFO[country];
};

export const formatPrice = (price: number, country: string | null | undefined): string => {
  const currencyInfo = getCurrencyInfo(country);
  
  // Format based on currency code
  if (currencyInfo.code === "JPY") {
    // Japanese Yen doesn't use decimals
    return `${currencyInfo.symbol}${Math.round(price).toLocaleString()}`;
  }
  
  return `${currencyInfo.symbol}${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
