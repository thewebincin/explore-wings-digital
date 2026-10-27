module.exports = {
  apps: [
    {
      name: 'explore-wings-web',
      script: 'server.js',
      instances: 1, // Single instance recommended for SQLite WAL mode
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
