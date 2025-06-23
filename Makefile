all: bin/nux


bin/nux: src/*
	mkdir -p bin
	rm -rf bin/modules
	mkdir -p bin/modules
	cp -R quickjs-x/node bin/modules/node
	cp -R src bin/modules/nux
	quickjs-x/qjsx-compile bin/nux bin/modules '--unhandled-rejection %/nux/main.js'

install: bin/nux
	mkdir -p "${HOME}"/.nux/nux
	rm -f "${HOME}"/.nux/nux/nux
	cp bin/nux "${HOME}"/.nux/nux/nux
	chmod +x "${HOME}"/.nux/nux/nux
	ln -sf "${HOME}"/.nux/nux/nux "${HOME}"/.nux/bin/nux

dev: bin/nux update
	rm -rf node_modules
	mkdir -p node_modules
	ln -s ../quickjs-x/node node_modules/node
	ln -s ../src node_modules/nux

update:
	git submodule update --remote quickjs-x

clean:
	cd quickjs-x && make clean-all
	rm -rf bin