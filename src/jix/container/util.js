

export const aptInstall = (...pkgs) => jix.dedent`
  RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  ${pkgs.join(" ")} && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
`