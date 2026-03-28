FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build the SvelteKit app
RUN npm run build

# Create and seed the database at build time
RUN mkdir -p data && \
    npx drizzle-kit migrate && \
    npx tsx src/lib/server/db/seed.ts && \
    npx tsx src/lib/server/db/seed-paths.ts && \
    npx tsx src/lib/server/db/seed-feeds.ts

FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && rm -rf /root/.npm

COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/data/app.db ./data/app.db.default
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && sed -i 's/\r$//' entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["./entrypoint.sh"]
