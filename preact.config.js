import asyncPlugin from 'preact-cli-plugin-fast-async';
import webpack from 'webpack';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned.
 *
 * @param {object} config - original webpack config.
 * @param {object} env - options passed to CLI.
 * @param {WebpackConfigHelpers} helpers - object with useful helpers when working with config.
 **/
export default function(config, env, helpers) {
  asyncPlugin(config);
  config.node.Buffer = true;
  config.entry['debug'] = './debug.js';

  if (!env.ssr) {
    const plugins = helpers.getPluginsByName(config, 'HtmlWebpackPlugin');
    const htmlPluginOptions = plugins[0].plugin.options;

    htmlPluginOptions.excludeChunks.push('debug');
  }

  const plugins = helpers.getPluginsByName(config, 'DefinePlugin');
  const definePlugin = plugins[0].plugin;
  definePlugin.definitions['process.env.SENTRY_DSN'] = JSON.stringify(
    process.env.SENTRY_DSN
  );

  if (config.devServer) {
    config.devServer.proxy = [
      {
        path: '/api/**',
        target: 'http://localhost:3000',
      },
    ];
  }
}
