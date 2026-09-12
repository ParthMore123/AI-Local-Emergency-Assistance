const { app, ensureReady } = require('./app');

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  ensureReady()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`AILEA API listening on http://localhost:${PORT}`);
        console.log('Demo login: demo@ailea.app / demo1234');
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    });
}

module.exports = app;
