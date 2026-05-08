FROM codercom/code-server:latest

USER root

ENV DEBIAN_FRONTEND=noninteractive
ENV npm_config_audit=false
ENV npm_config_fund=false
ENV npm_config_update_notifier=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    gnupg \
    python3 \
    python3-pip \
    python3-venv \
    unzip \
    wget \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install -g @openai/codex \
  && codex --version \
  && npm cache clean --force \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
