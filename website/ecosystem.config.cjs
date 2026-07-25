// pm2 process definition for the static Wit site.
//   make deploy            # build + start/reload under pm2
//   pm2 start ecosystem.config.cjs
//   pm2 logs witlang-site
//
// Port/host are read from website/.env by server.mjs (via site.config.mjs),
// so this file stays deployment-agnostic.

module.exports = {
  apps: [
    {
      name: 'witlang-site',
      script: './server.mjs',
      cwd: __dirname,
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
