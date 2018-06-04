FROM node:9.11.1-alpine
WORKDIR /usr/src/aika-server
COPY package*.json ./
RUN npm install
RUN npm install -g typescript
RUN npm install -g apidoc
COPY . .
RUN tsc -p tsconfig.json
RUN apidoc -i src -o apidoc
RUN rm -rf src tsconfig.json dockerfile apidoc.json
ENV NODE_ENV DEV
EXPOSE 3075
CMD ["npm", "start"]
