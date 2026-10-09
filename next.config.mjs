/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdfkit outside the Next.js bundle so Node resolves its
  // font/data files natively on Vercel (avoids bundler issues).
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
