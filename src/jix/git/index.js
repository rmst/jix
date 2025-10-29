import jix from "../base"


let checkout = ({repo, commit}) => jix.build`
	repo_url="${repo}"
	commit_hash="${commit}"

	# Step 1: Clone the repository shallowly
	git clone --no-checkout --depth 1 "$repo_url" ./repo
	
	# Step 2: Checkout the specified commit hash
	cd ./repo
	git fetch --depth 1 origin "$commit_hash"
	git -c advice.detachedHead=false checkout "$commit_hash"
	
	# Step 3: Initialize and update submodules shallowly
	git submodule update --init --depth 1
	
	# Step 4: Copy the repository to $out and remove .git directory
	rm -rf ".git"
	cd ..
	cp -r ./repo "$out"
`


export default {
	checkout,
}
