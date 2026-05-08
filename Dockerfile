# Next.js standalone image (pnpm). Build: docker build -t bonn-web .
# Run: docker run --rm -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=https://your-api.example/api bonn-web
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Client bundle embeds NEXT_PUBLIC_* at build time; override via:
# docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-host/api ...
ARG NEXT_PUBLIC_API_BASE_URL=https://survey-api.herz-check-bonn.de/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
