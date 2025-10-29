import { sh } from '../util';

const root = (path) => {
  let root = sh`cd "$(dirname "${path}")" && git rev-parse --show-toplevel`;
  return root.trim();
};

const clone = (path, remote, commit_hash) => {
  sh`
    set -e
    mkdir -p ${path}
    cd ${path}
    git init
    git remote add origin ${remote}
    git fetch --depth 1 origin ${commit_hash}
    git -c advice.detachedHead=false checkout ${commit_hash}
    # rm -rf .git
  `;

  return path;
};

const isClean = (path) => {
  let status = sh`
    git -C "${path}" status --porcelain
  `;
  return status == "";
};

const latestCommitHash = (path) => {
  return sh`
    git -C "${path}" rev-parse HEAD
  `.trim();
};

export default {
	root,
	clone,
	isClean,
	latestCommitHash,
}
