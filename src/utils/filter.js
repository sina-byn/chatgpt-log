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

const createBranch = () => {
  const hasBranch = execSync('git branch').toString().includes('gh-pages');
  const flag = !hasBranch ? '-c' : '';

  execSync(`git switch ${flag} gh-pages`);
};

const isBranchActive = () => {
  const stdout = execSync('git branch').toString();
  return !!/\s*\*\s*gh-pages\s*/g.exec(stdout);
};

const filter = async onBeforeCommit => {
  createBranch();
  if (!isBranchActive()) throw new Error("Failed switching to branch 'gh-pages'");

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
};

module.exports = filter;
