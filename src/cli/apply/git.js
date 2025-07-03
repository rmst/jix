import { sh } from '../util';

// UTILS
export const git = {};
git.root = (path) => {
  let root = sh`cd "$(dirname "${path}")" && git rev-parse --show-toplevel`;
  return root.trim();
};
git.clone = (path, remote, commit_hash) => {
  sh`
    set -e
    mkdir -p ${path}
    cd ${path}
    git init
    git remote add origin ${remote}
    git fetch --depth 1 origin ${commit_hash}
    git checkout ${commit_hash}
    # rm -rf .git
  `;

  return path;
};
git.isClean = (path) => {
  let status = sh`
    git -C "${path}" status --porcelain
  `;
  return status == "";
};
git.latestCommitHash = (path) => {
  return sh`
    git -C "${path}" rev-parse HEAD
  `.trim();
};
