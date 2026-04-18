FROM node:20-alpine

WORKDIR /app

# Copy prototype package files and install deps
COPY prototype/package*.json ./
RUN npm ci

# Copy the rest of the Next.js app
COPY prototype/ ./

# Build the app
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
