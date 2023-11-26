all: qjs_move

qjs_move: qjs_build
    mkdir -p bin
    mv quickjs/qjs bin/

qjs_build:
    cd quickjs && make qjs