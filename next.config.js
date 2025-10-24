/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Next.js from traversing outside the project when tracing files.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
