FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY controllers/ ./controllers/
COPY models/ ./models/
COPY routes/ ./routes/
COPY server/ ./server/
COPY shared/ ./shared/

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server/index.js"]
