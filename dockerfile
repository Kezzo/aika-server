FROM node:9.11.1-alpine
WORKDIR /usr/scr/aika-server
COPY package*.json ./
RUN npm install
RUN npm install -g typescript
COPY . .
RUN tsc -p tsconfig.json
RUN rm -rf src tsconfig.json dockerfile
EXPOSE 3075
CMD ["npm", "start"]
