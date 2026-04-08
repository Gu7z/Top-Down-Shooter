export default function getUrl(env = globalThis.__SNOWPACK_ENV__ || {}) {
  return env.MODE === "production"
    ? env.SNOWPACK_PUBLIC_API_URL_PROD
    : env.SNOWPACK_PUBLIC_API_URL_DEV;
}
