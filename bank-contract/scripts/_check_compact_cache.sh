#!/bin/bash

if [ ! -f .compact-cache ]; then # if the cache file does not exist, we need to recompile
  echo "Cache file .compact-cache does not exist. Recompiling..."
  exit 1
fi

if [ ! -d src/managed/bank ]; then # if the managed contract directory does not exist, we need to recompile
  echo "Managed contract directory src/managed/bank does not exist. Recompiling..."
  exit 1
fi

if [ src/bank.compact -nt .compact-cache ]; then # if the contract file is newer than the cache file, we need to recompile
  echo "src/bank.compact is newer than .compact-cache. Recompiling..."
  exit 1
fi

if [ src/index.ts -nt .compact-cache ]; then # if the index file is newer than the cache file, we need to recompile
  echo "src/index.ts is newer than .compact-cache. Recompiling..."
  exit 1
fi

echo 'Contract files unchanged, using cache'





