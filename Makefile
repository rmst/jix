BUILD_DIR ?= bin

all: $(BUILD_DIR)/nux

test:
	@BUILD_DIR="${TMPDIR}/nux-build" ENGINE="${ENGINE}" sh test/readline/readline.sh

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
	$(BUILD_DIR)/quickjs-x/qjsx-compile $(BUILD_DIR)/nux $(BUILD_DIR)/modules '--no-unhandled-rejection %/nux-cli/main.js'


install:
	$(MAKE) -C quickjs-x BIN_DIR=$(CURDIR)/$(BUILD_DIR)/quickjs-x/bin $(CURDIR)/$(BUILD_DIR)/quickjs-x/bin/qjsx
	sh install.sh

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
