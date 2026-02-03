FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm install
COPY . .
RUN mkdir -p uploads
EXPOSE 3010
CMD ["sh", "-c", "node scripts/runSchema.js && node scripts/seed.js && node src/index.js"]
