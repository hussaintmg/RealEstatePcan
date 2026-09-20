const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const logFile = path.resolve(__dirname, '../git-sync.log');
fs.writeFileSync(logFile, 'SCRIPT STARTED AT ' + new Date().toISOString() + '\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

try {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' };

  if (fs.existsSync('.git/index.lock')) {
    fs.unlinkSync('.git/index.lock');
    log('Removed .git/index.lock');
  }

  log('Executing git status:');
  const status = execSync('git status --short', { env, encoding: 'utf8' });
  log(status || '(Clean)');

  log('Executing git add:');
  execSync('git add -A', { env });
  log('Add completed.');

  log('Executing git commit:');
  execSync('git commit -m "feat: add 1-click instant demo login, properties testing hub, seed demo API, and fix next build type errors"', { env });
  log('Commit completed.');

  log('Executing git push origin main:');
  const pushOut = execSync('git push origin main', { env, encoding: 'utf8' });
  log('Push output: ' + pushOut);
  log('SYNC FINISHED SUCCESSFULLY!');
} catch (err) {
  log('ERROR: ' + err.message);
  if (err.stdout) log('Stdout: ' + err.stdout.toString());
  if (err.stderr) log('Stderr: ' + err.stderr.toString());
}
