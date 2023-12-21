all: bin/nux

bin/qjs:
	cd quickjs && make qjs
	mkdir -p bin
	mv quickjs/qjs bin/

bin/nux: src/*
	mkdir -p bin
	cd quickjs && make && ./qjsc -o ../bin/nux ../src/main.js 
	# cd quickjs && make clean

clean:
	cd quickjs && make clean
	rm -rf bin