#!/bin/bash

# Check if compile cache exists and if source files haven't changed
if [ -f .compile-cache ]; then
  # Check if any .compact file is newer than the cache
  if [ -z "$(find src -name '*.compact' -newer .compile-cache)" ]; then
    echo "Using cached compilation results"
    exit 0
  fi
fi

# Cache doesn't exist or source files have changed
exit 1