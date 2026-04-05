module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource tells React to use nativewind's JSX transform
      // so className prop works on all React Native components
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
  };
};
