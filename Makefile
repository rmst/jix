BUILD_DIR ?= bin

all: $(BUILD_DIR)/nux

# 	cp -R quickjs-x/node bin/modules/node

$(BUILD_DIR)/nux: $(shell find quickjs-x -type f) $(shell find src -type f) Makefile
	mkdir -p $(BUILD_DIR)
	rm -rf $(BUILD_DIR)/modules
	mkdir -p $(BUILD_DIR)/modules
	cp -R quickjs-x/node $(BUILD_DIR)/modules/node
	cp -R src/nux $(BUILD_DIR)/modules/nux
	cp -R src/nux-cli $(BUILD_DIR)/modules/nux-cli
	# Build qjsx in a dedicated copy under $(BUILD_DIR) so all artifacts live in BUILD_DIR
	rm -rf $(BUILD_DIR)/quickjs-x
	cp -R quickjs-x $(BUILD_DIR)/quickjs-x
	$(BUILD_DIR)/quickjs-x/qjsx-compile $(BUILD_DIR)/nux $(BUILD_DIR)/modules '--unhandled-rejection %/nux-cli/main.js'


install: $(HOME)/.nux/bin/nux


$(HOME)/.nux/bin/nux: $(BUILD_DIR)/nux
	mkdir -p "${HOME}"/.nux/nux
	rm -f "${HOME}"/.nux/nux/nux
	cp $(BUILD_DIR)/nux "${HOME}"/.nux/nux/nux
	chmod +x "${HOME}"/.nux/nux/nux
	ln -sf "${HOME}"/.nux/nux/nux "${HOME}"/.nux/bin/nux
	ln -sfn $(abspath src/nux) "${HOME}"/.nux/nux/lib

dev: $(BUILD_DIR)/nux update
	rm -rf node_modules
	mkdir -p node_modules
	ln -s ../quickjs-x/node node_modules/node
	ln -s ../src node_modules/nux

update:
	git submodule update --remote quickjs-x

clean:
	cd quickjs-x && make clean-all
	rm -rf $(BUILD_DIR)
