module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          ie: '11',
        },
        useBuiltIns: 'usage',
      },
    ],
  ],
  ignore: [
    '**/*.spec.js',
    '**/*.unit.js'
  ],
  plugins: [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-optional-chaining',
    ['babel-plugin-inline-import', { extensions: ['.hbs'] }]
  ],
};
