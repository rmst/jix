.PHONY: install install-dev test update clean

install:
	@BUILD_DIR_TMP=$${BUILD_DIR:-$$(mktemp -d)}; \
	[ -n "$(BUILD_DIR)" ] || trap 'rm -rf "$$BUILD_DIR_TMP"; cd quickjs-x && $(MAKE) clean-all' EXIT; \
	mkdir -p $$BUILD_DIR_TMP; \
	$(MAKE) -C quickjs-x BIN_DIR=$$BUILD_DIR_TMP/quickjs-x/bin $$BUILD_DIR_TMP/quickjs-x/bin/qjsx && \
	BUILD_DIR=$$BUILD_DIR_TMP sh install.sh

install-dev:
	@$(MAKE) install INSTALL_MODE=dev

update:
	git submodule update --remote quickjs-x

clean:
	cd quickjs-x && $(MAKE) clean-all
	rm -rf $(BUILD_DIR)
