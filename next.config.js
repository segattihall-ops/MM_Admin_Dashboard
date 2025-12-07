module.exports = {
  webpack: (config) => {
    config.cache = {
      type: "filesystem",
      buildDependencies: {
        config: [__filename],
      },
      allowCollectingMemory: true,
    };
    return config;
  },
};
