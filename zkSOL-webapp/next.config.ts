import type { NextConfig } from "next";

const webpack = require("webpack");

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add WASM file handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
    );
    // Add fallback for 'fs' module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      buffer: require.resolve("buffer/"),
    };

    return config;
  },
  /* config options here */
  env: {
    SOLANA_RPC_HOST: process.env.SOLANA_RPC_HOST,
    SOLANA_NETWORK: process.env.SOLANA_NETWORK,
    ZKLSOL_PROGRAM_ID: process.env.ZKLSOL_PROGRAM_ID,
  },
};

export default nextConfig;
