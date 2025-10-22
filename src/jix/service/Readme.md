# jix Service System

This module provides a platform-independent way to define and manage background services.

The primary export is the `service` effect, which allows you to define a script that should run as a persistent background service. The system automatically handles logging and ensures the service is started at the appropriate time (e.g., system startup or user login).

## Example

```javascript

export const myBackgroundService = jix.service({
  label: 'com.mycompany.myservice',
  runscript: `
    #!/bin/sh
    echo "Service started."
    while true; do
      echo "Service is running..."
      sleep 60
    done
  `,
  system: false // Run as a user agent
})
```

Currently, this system supports macOS (via `launchd`) and Linux (via `systemd`). Support for other platforms can be added in the future.
