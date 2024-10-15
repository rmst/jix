
set -e

mkdir -p "$HOME"/.nux/nux

cd quickjs
make qjs
cp qjs "$HOME"/.nux/nux/qjs
# make clean  # DEV INSTALL
cd ..

rm -rf "$HOME"/.nux/nux/src

# TODO: make dev/prod switch
# cp -r src "$HOME"/.nux/nux/src  # PROD INSTALL
ln -s "$(realpath src)" "$HOME"/.nux/nux/src  # DEV INSTALL

cp nux "$HOME"/.nux/nux/nux
chmod +x "$HOME"/.nux/nux/nux

ln -sf "$HOME"/.nux/nux/nux "$HOME"/.nux/bin/nux