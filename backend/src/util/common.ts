const USER_AGENT_CONFIGS = [
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    platform: '"Windows"',
    secChUa:
      '"Chromium";v="123", "Google Chrome";v="123", "Not-A.Brand";v="24"',
  },
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    platform: '"Windows"',
    secChUa: null,
  },
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.2420.81",
    platform: '"Windows"',
    secChUa:
      '"Chromium";v="123", "Microsoft Edge";v="123", "Not-A.Brand";v="24"',
  },
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0",
    platform: '"Windows"',
    secChUa: '"Chromium";v="123", "Opera";v="109", "Not-A.Brand";v="24"',
  },
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    platform: '"macOS"',
    secChUa:
      '"Chromium";v="123", "Google Chrome";v="123", "Not-A.Brand";v="24"',
  },
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:124.0) Gecko/20100101 Firefox/124.0",
    platform: '"macOS"',
    secChUa: null, // Firefox doesn't send sec-ch-ua headers
  },
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    platform: '"macOS"',
    secChUa: null, // Safari doesn't send sec-ch-ua headers
  },
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0",
    platform: '"macOS"',
    secChUa: '"Chromium";v="123", "Opera";v="109", "Not-A.Brand";v="24"',
  },
  {
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    platform: '"Linux"',
    secChUa:
      '"Chromium";v="123", "Google Chrome";v="123", "Not-A.Brand";v="24"',
  },
  {
    userAgent:
      "Mozilla/5.0 (X11; Linux i686; rv:124.0) Gecko/20100101 Firefox/124.0",
    platform: '"Linux"',
    secChUa: null, // Firefox doesn't send sec-ch-ua headers
  },
];

export const selectRandomUserAgent = () =>
  USER_AGENT_CONFIGS[Math.floor(Math.random() * USER_AGENT_CONFIGS.length)];
