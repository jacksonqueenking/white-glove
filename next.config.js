/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Next.js from traversing outside the project when tracing files.
  outputFileTracingRoot: __dirname,

  webpack: (config) => {
    // Ignore refractor language imports from react-syntax-highlighter
    config.resolve.alias = {
      ...config.resolve.alias,
      'refractor/lang': false,
    };

    return config;
  },
};

module.exports = nextConfig;
