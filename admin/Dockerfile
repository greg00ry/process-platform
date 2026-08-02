# This Dockerfile uses `serve` npm package to serve the static files with node process.
# You can find the Dockerfile for nginx in the following link:
# https://github.com/refinedev/dockerfiles/blob/main/vite/Dockerfile.nginx
FROM refinedev/node:22 AS base

FROM base as deps

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base as builder

ENV NODE_ENV production

# Vite bakes VITE_* vars into the bundle at build time - the app runs in the
# user's browser, not inside the compose network, so these must stay
# reachable from the host (localhost:<mapped-port>), not service names.
ARG VITE_API_URL
ARG VITE_WIDGET_BASE_URL
ARG VITE_OPERATON_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WIDGET_BASE_URL=$VITE_WIDGET_BASE_URL
ENV VITE_OPERATON_BASE_URL=$VITE_OPERATON_BASE_URL

COPY --from=deps /app/refine/node_modules ./node_modules

COPY . .

RUN npm run build

FROM base as runner

ENV NODE_ENV production

RUN npm install -g serve

COPY --from=builder /app/refine/dist ./

USER refine

CMD ["serve"]
