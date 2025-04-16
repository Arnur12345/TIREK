const config = {
    apiBaseUrl:
      process.env.NODE_ENV === "production"
        ? "https://your-production-api.com"
        : "http://127.0.0.1:5000",
  };
  
  export default config;
  