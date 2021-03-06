module.exports = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
    SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3000',
  },
};
