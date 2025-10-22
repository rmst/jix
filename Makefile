BUILD_DIR ?= bin

test:
	@BUILD_DIR="${TMPDIR}/jix-build" ENGINE="${ENGINE}" sh test/readline/readline.sh

install:
	$(MAKE) -C quickjs-x BIN_DIR=$(CURDIR)/$(BUILD_DIR)/quickjs-x/bin $(CURDIR)/$(BUILD_DIR)/quickjs-x/bin/qjsx
	sh install.sh

dev: $(BUILD_DIR)/jix update
	rm -rf node_modules
	mkdir -p node_modules
	ln -s ../quickjs-x/node node_modules/node
	ln -s ../src node_modules/jix

update:
	git submodule update --remote quickjs-x

clean:
	cd quickjs-x && make clean-all
	rm -rf $(BUILD_DIR)
