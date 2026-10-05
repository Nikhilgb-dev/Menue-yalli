module.exports = {
  apps: [
    {
      name: "menue-yalli-api",
      cwd: "./server",
      script: "src/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
