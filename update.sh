#!/usr/bin/env bash
set -euo pipefail

UPDATE_SCRIPT_VERSION="0.1.0"
REPO_URL="${VIBEIDE_REPO_URL:-https://github.com/12ali26/vibe-dashboard.git}"
INSTALL_DIR="${VIBEIDE_INSTALL_DIR:-}"
SERVER_IP="${SERVER_IP:-}"
MODE="${VIBEIDE_MODE:-}"

info() {
  printf '\n[INFO] %s\n' "$1"
}

fail() {
  printf '\n[ERROR] %s\n' "$1" >&2
  exit 1
}

run_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

usage() {
  cat <<'USAGE'
VibeIDE updater

Usage:
  ./update.sh
  curl -fsSL https://raw.githubusercontent.com/12ali26/vibe-dashboard/main/update.sh | bash

Optional:
  VIBEIDE_INSTALL_DIR=/path/to/vibeide ./update.sh
  VIBEIDE_MODE=bundled-ide ./update.sh
  VIBEIDE_MODE=dashboard-only ./update.sh

The updater preserves .env, workspaces, and config.
USAGE
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  usage
  exit 0
fi

if [ "${1:-}" = "--version" ] || [ "${1:-}" = "-v" ]; then
  printf 'VibeIDE update script %s\n' "$UPDATE_SCRIPT_VERSION"
  exit 0
fi

require_commands() {
  command -v git >/dev/null 2>&1 || fail "Git is not installed. Install Git, then run the updater again."
  command -v docker >/dev/null 2>&1 || fail "Docker is not installed. Install Docker, then run the updater again."
  if [ "$(id -u)" -ne 0 ]; then
    command -v sudo >/dev/null 2>&1 || fail "sudo is not installed. Run as root or install sudo, then run the updater again."
  fi
  docker compose version >/dev/null 2>&1 || fail "Docker Compose plugin is not available. Install the Docker Compose plugin, then run the updater again."
}

detect_install_dir() {
  if [ -n "$INSTALL_DIR" ]; then
    [ -d "$INSTALL_DIR/.git" ] || fail "VIBEIDE_INSTALL_DIR is set to '$INSTALL_DIR', but it is not a git checkout."
    cd "$INSTALL_DIR"
    return
  fi

  if [ -f "./docker-compose.yml" ] && [ -f "./package.json" ] && [ -d "./.git" ]; then
    INSTALL_DIR="$(pwd)"
    cd "$INSTALL_DIR"
    return
  fi

  if [ -d "$HOME/vibeide/.git" ]; then
    INSTALL_DIR="$HOME/vibeide"
    cd "$INSTALL_DIR"
    return
  fi

  if [ -d "$HOME/vibe-dashboard/.git" ]; then
    INSTALL_DIR="$HOME/vibe-dashboard"
    cd "$INSTALL_DIR"
    return
  fi

  fail "Could not find an existing VibeIDE install. Run from the VibeIDE folder or set VIBEIDE_INSTALL_DIR=/path/to/vibeide."
}

verify_repo() {
  [ -f "./docker-compose.yml" ] || fail "docker-compose.yml was not found in $INSTALL_DIR."
  [ -f "./package.json" ] || fail "package.json was not found in $INSTALL_DIR."

  local origin
  origin="$(git remote get-url origin 2>/dev/null || true)"
  if [ -z "$origin" ]; then
    fail "This VibeIDE folder has no git origin remote."
  fi

  if [ "$origin" != "$REPO_URL" ] && [ "$origin" != "${REPO_URL%.git}" ]; then
    info "Git origin is $origin."
  fi
}

ensure_docker_running() {
  run_sudo docker info >/dev/null 2>&1 || fail "Docker is not running. Start Docker, then run the updater again."
}

detect_running_mode() {
  local running_services
  running_services="$(run_sudo docker compose ps --status running --services 2>/dev/null || true)"

  if [ -z "$running_services" ]; then
    fail "No VibeIDE Docker Compose services are running in $INSTALL_DIR. Start VibeIDE first, then run the updater."
  fi

  if [ -n "$MODE" ]; then
    case "$MODE" in
      bundled-ide|dashboard-only)
        return
        ;;
      *)
        fail "VIBEIDE_MODE must be 'bundled-ide' or 'dashboard-only'."
        ;;
    esac
  fi

  if printf '%s\n' "$running_services" | grep -qx "code-server"; then
    MODE="bundled-ide"
    return
  fi

  if printf '%s\n' "$running_services" | grep -qx "dashboard"; then
    MODE="dashboard-only"
    return
  fi

  fail "Could not detect whether this install is dashboard-only or bundled-ide."
}

check_local_changes() {
  local changes
  changes="$(git status --porcelain --untracked-files=no)"

  if [ -n "$changes" ]; then
    printf '%s\n' "$changes"
    fail "Tracked files have local changes. Commit or stash them before updating. The updater will not touch .env, workspaces, or config."
  fi
}

pull_latest() {
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"

  if [ "$branch" = "HEAD" ]; then
    fail "This checkout is in detached HEAD state. Check out a branch like 'main', then run the updater again."
  fi

  info "Pulling latest VibeIDE changes on branch '$branch'."
  git fetch origin
  git pull --ff-only origin "$branch"
}

build_images() {
  info "Rebuilding Docker images."
  if [ "$MODE" = "bundled-ide" ]; then
    run_sudo docker compose --profile bundled-ide build
  else
    run_sudo docker compose build dashboard
  fi
}

restart_services() {
  if [ "$MODE" = "bundled-ide" ]; then
    info "Restarting dashboard and bundled IDE."
    run_sudo docker compose --profile bundled-ide up -d
  else
    info "Restarting dashboard only."
    run_sudo docker compose up -d dashboard
  fi
}

env_value() {
  local key="$1"
  local default_value="$2"

  if [ -f .env ]; then
    local value
    value="$(grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- || true)"
    if [ -n "$value" ]; then
      printf '%s\n' "$value"
      return
    fi
  fi

  printf '%s\n' "$default_value"
}

detect_server_ip() {
  if [ -n "$SERVER_IP" ]; then
    return
  fi

  SERVER_IP="$(curl -fsS --max-time 5 https://checkip.amazonaws.com 2>/dev/null || true)"

  if [ -z "$SERVER_IP" ]; then
    SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi

  if [ -z "$SERVER_IP" ]; then
    SERVER_IP="your-server-ip"
  fi
}

print_result() {
  detect_server_ip

  local dashboard_port
  local ide_port
  dashboard_port="$(env_value DASHBOARD_PORT 3000)"

  if [ "$MODE" = "bundled-ide" ]; then
    ide_port="$(env_value BUNDLED_CODE_SERVER_PORT 8080)"
  else
    ide_port="$(env_value CODE_SERVER_PORT 8080)"
  fi

  printf '\nVibeIDE update complete.\n'
  printf 'Mode: %s\n' "$MODE"
  printf '\nAccess URLs:\n'
  printf '  Dashboard: http://%s:%s\n' "$SERVER_IP" "$dashboard_port"
  printf '  IDE:       http://%s:%s\n' "$SERVER_IP" "$ide_port"
  printf '\nPreserved local data:\n'
  printf '  .env\n'
  printf '  workspaces/\n'
  printf '  config/\n'
  printf '\nUseful commands:\n'
  printf '  cd %s\n' "$INSTALL_DIR"
  printf '  sudo docker compose ps\n'
  printf '  sudo docker compose logs\n'
}

main() {
  require_commands
  detect_install_dir

  info "Using VibeIDE install at $INSTALL_DIR."
  verify_repo
  ensure_docker_running
  detect_running_mode

  info "Detected update mode: $MODE."
  info "Preserving .env, workspaces, and config."

  check_local_changes
  pull_latest
  build_images
  restart_services
  print_result
}

main "$@"
