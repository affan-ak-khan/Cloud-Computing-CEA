FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Run as the non-root "node" user that ships with the image
USER node

EXPOSE 3000
CMD ["node", "src/server.js"]
