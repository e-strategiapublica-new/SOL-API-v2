export const configuration = () => ({
  NODE_ENV: process.env.NODE_ENV || 'dev',
  PORT: parseInt(process.env.PORT, 10),
  ENABLE_CORS: process.env.ENABLE_CORS || true,
  ENABLE_DOCS: process.env.ENABLE_CORS || true,
  LACCHAIN_PROVIDER: process.env.LACCHAIN_PROVIDER,
  LACCHAIN_PRIVATE_KEY: process.env.LACCHAIN_PRIVATE_KEY,
  LACCHAIN_NODE_ADDRESS: process.env.LACCHAIN_NODE_ADDRESS,
  LACCHAIN_EXPIRATION: process.env.LACCHAIN_EXPIRATION,
  LACCHAIN_CONTRACT: process.env.LACCHAIN_CONTRACT
});
