#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${VIBEIDE_REPO_URL:-https://github.com/12ali26/vibe-dashboard.git}"
INSTALL_DIR="${VIBEIDE_INSTALL_DIR:-$HOME/vibeide}"
SERVER_IP="${SERVER_IP:-}"

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

require_ubuntu() {
  if [ ! -f /etc/os-release ]; then
    fail "This installer currently targets Ubuntu. /etc/os-release was not found."
  fi

  # shellcheck disable=SC1091
  . /etc/os-release

  if [ "${ID:-}" != "ubuntu" ]; then
    fail "This installer currently targets Ubuntu. Detected: ${PRETTY_NAME:-unknown Linux}."
  fi
}

install_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    info "Docker and Docker Compose plugin are already installed."
    return
  fi

  info "Installing Docker Engine and Docker Compose plugin for Ubuntu."
  run_sudo apt-get update
  run_sudo apt-get install -y ca-certificates curl gnupg
  run_sudo install -m 0755 -d /etc/apt/keyrings

  if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | run_sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    run_sudo chmod a+r /etc/apt/keyrings/docker.gpg
  fi

  # shellcheck disable=SC1091
  . /etc/os-release
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    | run_sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

  run_sudo apt-get update
  run_sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  info "Docker installed."
}

install_git() {
  if command -v git >/dev/null 2>&1; then
    info "Git is already installed."
    return
  fi

  info "Installing Git."
  run_sudo apt-get update
  run_sudo apt-get install -y git
}

clone_or_use_repo() {
  if [ -f "./docker-compose.yml" ] && [ -f "./package.json" ]; then
    INSTALL_DIR="$(pwd)"
    info "Using current directory as VibeIDE repo: $INSTALL_DIR"
    return
  fi

  if [ -d "$INSTALL_DIR/.git" ]; then
    info "VibeIDE repo already exists at $INSTALL_DIR."
    cd "$INSTALL_DIR"
    return
  fi

  info "Cloning VibeIDE into $INSTALL_DIR."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
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

create_env_file() {
  mkdir -p ./workspaces ./config/code-server

  if [ -f .env ]; then
    info ".env already exists. Leaving it unchanged."
    return
  fi

  local password
  password="$(openssl rand -base64 18 2>/dev/null || date +%s | sha256sum | cut -c1-24)"

  info "Creating .env for bundled IDE mode."
  if [ -f .env.bundled.example ]; then
    cp .env.bundled.example .env
  else
    cp .env.example .env
    sed -i "s|^HOST_WORKSPACES_DIR=.*|HOST_WORKSPACES_DIR=./workspaces|" .env
    sed -i "s|^WORKSPACES_DIR=.*|WORKSPACES_DIR=/workspaces|" .env
  fi

  sed -i "s|^DASHBOARD_PORT=.*|DASHBOARD_PORT=3000|" .env
  sed -i "s|^CODE_SERVER_PORT=.*|CODE_SERVER_PORT=8080|" .env
  sed -i "s|^BUNDLED_CODE_SERVER_PORT=.*|BUNDLED_CODE_SERVER_PORT=8080|" .env
  sed -i "s|^CODE_SERVER_PASSWORD=.*|CODE_SERVER_PASSWORD=$password|" .env
  sed -i "s|^CODE_SERVER_URL=.*|CODE_SERVER_URL=|" .env

  printf '\n[INFO] Generated code-server password: %s\n' "$password"
  printf '[INFO] It is saved in %s/.env as CODE_SERVER_PASSWORD.\n' "$INSTALL_DIR"
}

start_stack() {
  info "Building dashboard image."
  run_sudo docker compose build

  info "Starting bundled VibeIDE stack."
  run_sudo docker compose --profile bundled-ide up -d
}

print_result() {
  detect_server_ip

  printf '\nVibeIDE bundled stack is starting.\n'
  printf 'This installer is for fresh servers and starts both dashboard and code-server.\n'
  printf '\nAccess URLs:\n'
  printf '  Dashboard: http://%s:3000\n' "$SERVER_IP"
  printf '  IDE:       http://%s:8080\n' "$SERVER_IP"
  printf '\nUseful commands:\n'
  printf '  cd %s\n' "$INSTALL_DIR"
  printf '  sudo docker compose logs\n'
  printf '  sudo docker compose ps\n'
  printf '  sudo docker compose down\n'
  printf '\nOpen AWS/security-group ports: 3000/tcp and 8080/tcp.\n'
}

main() {
  require_ubuntu
  install_docker
  install_git
  clone_or_use_repo
  create_env_file
  start_stack
  print_result
}

main "$@"
