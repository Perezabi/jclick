module.exports = {
  apps: [
    {
      name: "jclick-backend",
      script: "./server.js",
      instances: "max", // Utilizes all available CPU cores
      exec_mode: "cluster", // Enables load balancing
      max_memory_restart: "1G", // Auto-restart if memory exceeds 1GB
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};