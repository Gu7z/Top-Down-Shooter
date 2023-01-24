import.meta.hot; // For snowpack env

const getUrl = () => {
  const { SNOWPACK_PUBLIC_API_URL_PROD, SNOWPACK_PUBLIC_API_URL_DEV, MODE } =
    __SNOWPACK_ENV__;

  return MODE === "production"
    ? SNOWPACK_PUBLIC_API_URL_PROD
    : SNOWPACK_PUBLIC_API_URL_DEV;
};

export default getUrl;
