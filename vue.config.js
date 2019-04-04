module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/test1/dist/'
    : '/',
  chainWebpack: config => {
    config.module.rules.delete('eslint');
  }
}
