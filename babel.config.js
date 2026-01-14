module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Hermes supports modern JavaScript syntax natively
          // Optional chaining (?.), nullish coalescing (??), etc. are supported
          jsxRuntime: 'automatic',
        },
      ],
    ],
    // babel-preset-expo already includes @babel/plugin-transform-optional-chaining
    // No additional plugins needed for Hermes compatibility
  };
};

