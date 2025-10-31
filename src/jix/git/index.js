import jix from "../base"
import nix from "../nix"

let git = () => {
	let target = jix.target()

	if(target.host.os === "nixos") {
		return nix.pkgs.git.git
	}

	return jix.existingCommand("git")
}


let checkout = ({repo, commit}) => jix.build`
	repo_url="${repo}"
	commit_hash="${commit}"

	alias git="${git}"

	git -c advice.defaultBranchName=false init ./repo
	cd ./repo
	git remote add origin "$repo_url"
	git fetch --depth 1 origin "$commit_hash"
	git -c advice.detachedHead=false checkout FETCH_HEAD
	git submodule update --init --recursive --depth 1 --recommend-shallow
	rm -rf ".git"
	cd ..
	cp -r ./repo "$out"
`


export default {
	checkout,
	git,
}
