module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        unstable_transformImportMeta: true // Add this option to fix Zustand import.meta error
      }]
    ],
  };
};
