/** Run repository regressions against an isolated local server. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

process.chdir(path.resolve(__dirname, '../..'));

function startServer() {
  // Let the OS reserve the port; an unrelated server must never satisfy readiness.
  const server = spawn(
    'python3',
    [
      '-u',
      '-c',
      [
        'from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler',
        'server = ThreadingHTTPServer(("127.0.0.1", 0), SimpleHTTPRequestHandler)',
        'print(server.server_port, flush=True)',
        'server.serve_forever()',
      ].join('\n'),
    ],
    { stdio: ['ignore', 'pipe', 'ignore'] },
  );
  const ready = new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => finish(new Error('Test server did not become ready')), 5000);
    const finish = (error, url) => {
      clearTimeout(timer);
      server.stdout.removeListener('data', onData);
      server.removeListener('error', onError);
      server.removeListener('exit', onExit);
      if (error) reject(error);
      else resolve(url);
    };
    const onData = (chunk) => {
      output += chunk;
      if (!output.includes('\n')) return;
      const port = Number(output.trim());
      if (!Number.isInteger(port) || port < 1 || port > 65535)
        finish(new Error('Test server reported an invalid port'));
      else finish(null, `http://127.0.0.1:${port}/`);
    };
    const onError = (error) => finish(error);
    const onExit = (code) => finish(new Error(`Test server could not start (${code})`));
    server.stdout.on('data', onData);
    server.once('error', onError);
    server.once('exit', onExit);
  });
  return { server, ready };
}

(async () => {
  const available = fs
    .readdirSync('tests')
    .filter((name) => name.endsWith('.cjs') && !name.endsWith('-helpers.cjs'))
    .sort();
  const requested = process.argv.slice(2);
  for (const name of requested) {
    if (!available.includes(name)) throw new Error(`Unknown regression: ${name}`);
  }
  const files = requested.length ? requested : available;
  const { server, ready } = startServer();
  const cleanup = () => {
    if (server.exitCode === null) server.kill();
  };
  process.once('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });
  process.once('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  try {
    const url = await ready;
    const env = { ...process.env, SKY_MOTION_TEST_URL: url };
    console.log(`Testing ${files.length} regressions at ${url}`);
    for (const file of files) {
      console.log(`Running ${file}`);
      const ownProcessGroup = process.platform !== 'win32';
      const result = spawnSync(process.execPath, [path.join('tests', file)], {
        env,
        stdio: 'inherit',
        timeout: 300000,
        detached: ownProcessGroup,
      });
      // A failed script may leave its browser children running after Node exits.
      if (ownProcessGroup && result.pid) {
        try {
          process.kill(-result.pid, 'SIGTERM');
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
      }
      if (result.error) throw result.error;
      if (result.status !== 0)
        throw new Error(`${file} failed (${result.status ?? result.signal})`);
    }
  } finally {
    cleanup();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
