#!/bin/bash

# CONFIGURATION
REMOTE_USER="gruppe5"
REMOTE_HOST="141.72.12.103"
REMOTE_DIR="/home/gruppe5"
PROJECT_DIR="./CAT"

# Ensure script exits on any error
set -e

echo "📤 Copying project files to remote server..."
scp -r $PROJECT_DIR $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR

echo "🚀 Deploying and restarting server on remote..."
ssh $REMOTE_USER@$REMOTE_HOST << EOF
  # Gehe ins Hauptverzeichnis des Benutzers
  cd $REMOTE_DIR

  echo "🛑 Stopping the old server process..."
  # Überprüfe, ob eine PID-Datei existiert
  if [ -f backend.pid ]; then
    # Beende den Prozess mit SIGKILL (-9) für garantierte Terminierung
    # und leite Fehler um, falls der Prozess nicht mehr existiert
    kill -9 \$(cat backend.pid) 2>/dev/null || true
    rm -f backend.pid
    echo "Old process stopped. Waiting for port to be released..."
    # Gib dem Betriebssystem 2 Sekunden Zeit, den Port freizugeben
    sleep 2
  else
    echo "No running process found (no PID file)."
  fi

  echo "🐍 Starting the new server..."
  # Aktiviere die virtuelle Umgebung
  source venv/bin/activate

  # Starte den Server im Hintergrund
  python3 -m CAT.API.pages_connection_api > backend.log 2>&1 &

  # Speichere die neue Prozess-ID
  echo \$! > backend.pid

EOF

echo "✅ Deployment completed successfully!"