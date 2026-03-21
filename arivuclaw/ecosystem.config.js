module.exports = {
  apps: [
    {
      name: "arivumaiyam",
      script: "npx",
      args: "ts-node src/cli/index.ts start",
      cwd: __dirname,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
      },
      // Logging
      error_file: "./logs/arivumaiyam-error.log",
      out_file: "./logs/arivumaiyam-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Memory limit — restart if exceeds 1GB
      max_memory_restart: "1G",
    },
  ],
};
