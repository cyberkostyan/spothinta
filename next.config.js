const createNextIntlPlugin = require("next-intl/plugin")

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "finland-electricity-prices.vercel.app" }],
        destination: "https://spothinta.app/:path*",
        permanent: true,
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
