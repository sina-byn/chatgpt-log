const fs = require('fs');
const { execSync } = require('child_process');

// * constants
const EXCLUDED_PATHS = [
  '.git',
  'app.js',
  'style.css',
  'index.html',
  '.gitignore',
  '.prettierrc',
  'node_modules',
  'package.json',
  '.gitattributes',
  'package-lock.json',
];

const getRepoInfo = remote => {
  const remoteURL = execSync(`git remote get-url ${remote}`).toString().trim();
  if (!remoteURL) return;

  const urlChunks = remoteURL.split('/');
  const remoteRepo = urlChunks.at(-1);
  const repo = remoteRepo.slice(0, remoteRepo.lastIndexOf('.'));

  const isHttps = remoteURL.startsWith('https');
  let account;

  if (isHttps) {
    account = urlChunks.at(-2);
    return [repo, account];
  }

  account = urlChunks[0].slice(urlChunks[0].lastIndexOf(':') + 1);
  return [repo, account];
};

const createBranch = () => {
  const branchLog = execSync('git branch -a')
    .toString()
    .split('\n')
    .map(l => l.trim().replace(/\*|\s/g, ''))
    .filter(Boolean);

  const hasLocalBranch = branchLog.includes('gh-pages');
  const hasRemoteBranch = branchLog.includes('remotes/origin/gh-pages');
  const flag = hasLocalBranch || hasRemoteBranch ? '' : '-c';

  if (!hasLocalBranch && hasRemoteBranch) execSync('git fetch origin gh-pages:gh-pages');

  execSync(`git switch ${flag} gh-pages`);

  return branchLog;
};

const isBranchActive = () => {
  const stdout = execSync('git branch').toString();
  return !!/\s*\*\s*gh-pages\s*/g.exec(stdout);
};

const filter = async onBeforeCommit => {
  const branchLog = createBranch();
  if (!isBranchActive()) throw new Error("Failed switching to branch 'gh-pages'");

  const hasRemoteBranch = branchLog.includes('remotes/origin/gh-pages');
  if (hasRemoteBranch) execSync('git pull origin gh-pages');

  const htmlRegex = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.html/;
  const paths = fs.readdirSync('.');

  for (const path of paths) {
    if (htmlRegex.test(path) || EXCLUDED_PATHS.includes(path)) continue;

    fs.rmSync(path, { force: true, recursive: true });
  }

  if (onBeforeCommit) await onBeforeCommit();

  const timestamp = new Date().toISOString();

  execSync('git add .');
  execSync(`git commit -m "deploy - ${timestamp}"`);
  execSync('git push -u origin gh-pages');
  execSync('git switch main');
  execSync('git restore index.html');

  const repoInfo = getRepoInfo('origin');

  return repoInfo;
};

module.exports = filter;
