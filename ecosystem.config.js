module.exports = {
  apps: [{
    name: 'show-love',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SESSION_SECRET: 'sl-prod-k8x9m2w4'
    }
  }]
};
