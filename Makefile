.PHONY: install install-dev test update clean

install:
	@$(MAKE) _install
	@cp -R src/jix "$(HOME)/.jix/jix/modules/jix"
	@cp -R src/jix-cli "$(HOME)/.jix/jix/modules/jix-cli"

install-dev:
	@$(MAKE) _install
	@ln -sf "$(CURDIR)/src/jix" "$(HOME)/.jix/jix/modules/jix"
	@ln -sf "$(CURDIR)/src/jix-cli" "$(HOME)/.jix/jix/modules/jix-cli"

# Build qjsx, then install common files
_install:
	@PLATFORM=$$(uname -s | tr '[:upper:]' '[:lower:]'); \
	$(MAKE) -C quickjs-x build; \
	mkdir -p "$(HOME)/.jix/jix" "$(HOME)/.jix/jix/modules" "$(HOME)/.jix/bin"; \
	if [ "$$PLATFORM" = "darwin" ]; then \
		cp -c "quickjs-x/bin/$$PLATFORM/qjsx" "$(HOME)/.jix/jix/qjsx"; \
	else \
		cp "quickjs-x/bin/$$PLATFORM/qjsx" "$(HOME)/.jix/jix/qjsx"; \
	fi; \
	chmod +x "$(HOME)/.jix/jix/qjsx"; \
	rm -rf "$(HOME)/.jix/jix/modules"; \
	mkdir -p "$(HOME)/.jix/jix/modules"; \
	cp -R quickjs-x/qjsx-node/node "$(HOME)/.jix/jix/modules/node"; \
	cp src/scripts/jix "$(HOME)/.jix/jix/jix"; \
	chmod +x "$(HOME)/.jix/jix/jix"; \
	rm -f "$(HOME)/.jix/bin/jix"; \
	ln -sf "$(HOME)/.jix/jix/jix" "$(HOME)/.jix/bin/jix"; \
	cp src/scripts/shell_integration "$(HOME)/.jix/jix/shell_integration"; \
	echo "✅ Installation complete!"; \
	echo ""; \
	echo "Jix installed to: $(HOME)/.jix/jix/jix"; \
	echo "Symlink created: $(HOME)/.jix/bin/jix"; \
	echo ""; \
	case ":$$PATH:" in \
		*:"$(HOME)/.jix/bin":*) \
			;; \
		*) \
			echo "To use jix, add this to your shell rc file:"; \
			echo ""; \
			echo "  . \"\$${HOME}/.jix/jix/shell_integration\""; \
			echo ""; \
			;; \
	esac

update:
	git submodule update --remote quickjs-x

clean:
	cd quickjs-x && $(MAKE) clean-all
