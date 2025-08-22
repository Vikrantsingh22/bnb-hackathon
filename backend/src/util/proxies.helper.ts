import { HttpsProxyAgent } from "https-proxy-agent";
import logger from "./winstonLogger";

// Your proxy credentials
const proxyUser = process.env.PROXY_USER;
const proxyPass = process.env.PROXY_PASS;
const proxyHost = process.env.PROXY_HOST;
if (!proxyUser || !proxyPass || !proxyHost) {
  logger.error("Proxy credentials are not set in environment variables.");
  throw new Error("Proxy credentials are not set in environment variables.");
}

const basePort = 10000;
const maxProxies = 10;

export function getProxyAgent() {
  const now = new Date();
  const seconds = now.getSeconds(); // value from 0 to 59
  logger.info(
    `Current Time: ${now.toISOString()} | Current Time in Seconds: ${seconds}`
  );

  const proxyIndex = (seconds % maxProxies) + 1;
  const proxyPort = basePort + proxyIndex;
  logger.info(`Using Proxy Port: ${proxyHost}:${proxyPort}`);

  const proxyUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;
  return new HttpsProxyAgent(proxyUrl);
}
