FROM node:20-bookworm-slim

WORKDIR /app

ENV npm_config_audit=false
ENV npm_config_fund=false
ENV npm_config_update_notifier=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci \
  && npm cache clean --force

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV WORKSPACES_DIR=/workspaces

EXPOSE 3000

CMD ["npm", "run", "start"]
