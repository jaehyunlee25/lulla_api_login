module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: 'login',
        permanent: true,
      },
    ];
  },
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback={ 
		fs: false, 
		module: false, 
		http:require.resolve("stream-http") 
	};
    return config;
  },
};