const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

config.resolver.alias = {

  '@expo/metro-config/build/async-require': require.resolve('./async-require.js'),

  '@supabase/node-fetch': require.resolve('./node-fetch.js'),

};

module.exports = config;