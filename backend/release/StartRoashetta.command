#!/bin/bash

# Roashetta Server Launcher
# Double-click this file to start the server

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the release directory
cd "$DIR"

echo "================================"
echo "   Roashetta Server Starting    "
echo "================================"
echo ""
echo "Server will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server
./RoashettaServer

# Keep terminal open if server crashes
read -p "Press Enter to close..."
