#!/bin/bash

ENV_FILE=".env.local"
INSTALL_DIR="/opt/youtrack-cli"

#bun install
bun run compile

sudo mkdir -p $INSTALL_DIR
sudo cp ./dist/youtrack-cli $INSTALL_DIR/youtrack
sudo cp ./$ENV_FILE $INSTALL_DIR/.env

mkdir -p ~/.local/bin
ln -sf $INSTALL_DIR/youtrack ~/.local/bin/youtrack

echo "!!! add ~/.local/bin to your \$PATH"
