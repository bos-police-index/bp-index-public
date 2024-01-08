const nextRoutes = require("nextjs-routes/config");
const withRoutes = nextRoutes();

const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.mjs
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure pageExtensions to include md and mdx
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // Optionally, add any other Next.js config below
  reactStrictMode: false,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

// arrestinformation
const withTM = require("next-transpile-modules")(["json-loader"]);

module.exports = withTM({
  webpack(config, options) {
    config.module.rules.push({
      test: /\.geojson$/,
      use: ["json-loader"],
    });

    return config;
  },
});

// Merge MDX config with Next.js config
module.exports = withRoutes(withMDX(nextConfig));

// superjson SWC plugin
module.exports = {
  experimental: {
    swcPlugins: [["next-superjson-plugin", {}]],
  },
};