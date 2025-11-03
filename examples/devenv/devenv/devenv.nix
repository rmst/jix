{ config, lib, pkgs, ... }:

{
  packages = [
    pkgs.jq
  ];

  scripts.silly-example.exec = ''echo "{"\"name\":\""$1"\",\"greeting\":\"Hello $1!\",\"timestamp\":\"$(date -Iseconds)\"}" | jq '';

  scripts.serious-example.exec = ''cowsay "$*"'';
  scripts.serious-example.packages = [ pkgs.cowsay ];

  scripts.python-hello.exec = ''print("Hello, world!")'';
  scripts.python-hello.package = pkgs.python3Minimal;

  scripts.nushell-greet.exec = ''
    def greet [name] {
      ["hello" $name]
    }

    greet "world"
  '';
  scripts.nushell-greet.package = pkgs.nushell;
  scripts.nushell-greet.binary = "nu";

  scripts.file-example.exec = ./file-script.sh;

  enterShell = ''
    echo
    echo 🦾 Helper scripts you can run to make your development richer:
    echo 🦾 silly-example
    echo 🦾 serious-example
    echo 🦾 python-hello
    echo 🦾 nushell-greet
    echo 🦾 file-example
    echo
  '';
}
