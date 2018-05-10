FROM node:9.11.1-alpine
WORKDIR /usr/src/aika-server
COPY package*.json ./
RUN npm install
RUN npm install -g typescript
COPY . .
RUN tsc -p tsconfig.json
RUN rm -rf src tsconfig.json dockerfile
ENV NODE_ENV DEV
EXPOSE 3075
CMD ["npm", "start"]
