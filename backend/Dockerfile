# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build
ENV PORT=4000
EXPOSE 4000
CMD ["npm","run","start"]