/**
 * PM2 Ecosystem Configuration for LuminaOptic Specs Billing
 * Target Subdomain: specs-billing.gemshine.tech
 * Backend Port: 5026
 * Database: MongoDB (mongodb://127.0.0.1:27017/specs_billing)
 */

module.exports = {
  apps: [
    {
      name: 'specs-billing-server',
      script: './dist-server/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 5026,
        CLIENT_URL: 'https://specs-billing.gemshine.tech',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/specs_billing',
        DATA_FILE_PATH: './server/data/db.json',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5026,
        CLIENT_URL: 'https://specs-billing.gemshine.tech',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/specs_billing',
        DATA_FILE_PATH: './server/data/db.json',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};

