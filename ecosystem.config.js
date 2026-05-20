module.exports = {
  apps: [{
    name: 'show-love',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SESSION_SECRET: 'your-session-secret-here'
    }
  }]
};
