/* eslint-disable */
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HappyPack = require('happypack');
const path = require('path');
const TSConfigResolver = require('./tsconfig-resolver');
const { BannerPlugin } = require('webpack');

module.exports = {
  webpack: (config, options, webpack) => {
    // Perform customizations to config
    // Important: return the modified config
    console.log(`Starting backpack in ${options.env || 'dev'} mode...`);
    config.entry.main = [
      './src/index.ts',
    ];
    config.resolve = {
      extensions: ['.ts', '.js', '.json'],
      alias: TSConfigResolver({
        tsConfigPath: './tsconfig.json',
      }),
    };
    config.devtool = 'eval-cheap-module-source-map';
    config.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          sourceMap: true,
          terserOptions: {
            keep_classnames: true,
            keep_fnames: true,
          },
        }),
      ],
    };

    // Here we stop with everything for production, and return config immediately
    if (options.env === 'production') {
      config.devtool = false;
      // Change banner plugins to add version info
      // Important: this assumes that BannerPlugin is at index [1]
      config.plugins[1] = new BannerPlugin({
        banner: `process.env.npm_package_version=process.env.npm_package_version||"${process.env.npm_package_version}"`,
        raw: true,
        include: /main\.js/,
      });
      config.module.rules.push(
        {
          test: /\.ts$/,
          use: 'ts-loader',
        },
      );
      config.output.path = path.join(process.cwd(), 'dist');

      return config;
    }

    config.module.rules.push(
      {
        test: /\.ts$/,
        use: 'happypack/loader',
      },
    );

    config.devtool = 'source-map';

    config.plugins = [
      ...config.plugins,
      new HappyPack({
        loaders: [{
          loader: 'ts-loader',
          options: {
            happyPackMode: true,
            transpileOnly: true,
          },
        }],
      }),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: './tsconfig.json',
          diagnosticOptions: {
            semantic: true,
            syntactic: true,
          },
        },
        eslint: {
          files: './**/*.{ts,js}',
          options: { fix: true },
        },
      }),
    ];

    return config;
  },
};