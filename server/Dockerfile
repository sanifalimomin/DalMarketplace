# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install production dependencies against the committed lockfile.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source. The git-ignored .env and .firebase/ are excluded via .dockerignore;
# on Render those values come from environment variables instead.
COPY . .

ENV NODE_ENV=production
# Render injects PORT at runtime; server.js reads process.env.PORT (defaults to 5000).
EXPOSE 5000

CMD ["node", "server.js"]
