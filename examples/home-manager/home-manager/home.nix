{ lib, pkgs, ... }: let
  username = "myusername";
in {
  home = {
    packages = with pkgs; [
      hello
      cowsay
      lolcat
    ];

    inherit username;
    homeDirectory = "/home/${username}";

    file = {
      "hello.sh" = {
        text = ''
          #!/usr/bin/env bash

          echo "Hello, ${username}!"
          echo '*slaps roof* This script can fit so many lines in it'
        '';
        executable = true;
      };
    };

    stateVersion = "23.11";
  };

  programs.git = {
    enable = true;
    userName = "My Name";
    userEmail = "me@example.com";
    extraConfig = {
      init.defaultBranch = "main";
    };
  };
}
