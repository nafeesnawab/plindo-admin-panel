module.exports = {
  apps: [{
    name: 'plindo-backend',
    cwd: '/var/www/plindo/backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/www/plindo/logs/backend-error.log',
    out_file: '/var/www/plindo/logs/backend-out.log',
    log_file: '/var/www/plindo/logs/backend-combined.log',
    time: true
  }]
};
