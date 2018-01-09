/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned. 
 * 
 * @param {object} config - original webpack config.
 * @param {object} env - options passed to CLI.
 * @param {WebpackConfigHelpers} helpers - object with useful helpers when working with config.
 **/
export default function(config, env, helpers) {
  config.node.Buffer = true;
  config.entry['debug'] = './debug.js';

  if (!env.ssr) {
    const plugins = helpers.getPluginsByName(config, 'HtmlWebpackPlugin');
    const htmlPluginOptions = plugins[0].plugin.options;

    htmlPluginOptions.excludeChunks.push('debug');
  }

  config.devServer.proxy = [
    {
      path: '/api/**',
      target: 'http://localhost:3000'
    }
  ];
}
