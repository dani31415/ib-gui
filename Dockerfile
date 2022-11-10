FROM node:18 as front

WORKDIR /usr/app
COPY front/package*.json ./
RUN npm install
COPY ./front ./
RUN npm run build

FROM node:18

WORKDIR /usr/app
COPY back/package*.json ./
RUN npm install
COPY ./back ./
COPY --from=front /usr/app/build ./public
EXPOSE 30303
CMD npm start
