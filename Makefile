all: bin/nux

# bin/qjs:
# 	cd quickjs && make qjs
# 	mkdir -p bin
# 	mv quickjs/qjs bin/

# bin/nux: src/*
# 	mkdir -p bin
# 	cd quickjs && make && ./qjsc -o ../bin/nux ../src/main.js 
# 	# cd quickjs && make clean

bin/nux: src/*
	mkdir -p bin
	mkdir -p bin/modules
	cp -R quickjs-x/node/. bin/modules/
	cp -R src/. bin/modules/nux
	quickjs-x/qjsx-compile bin/nux bin/modules '--unhandled-rejection %/nux/main.js'

clean:
	cd quickjs-x && make clean-all
	rm -rf bin