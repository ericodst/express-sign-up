FROM node:slim
ADD public/ /app/public/
ADD views/ /app/views/
COPY app.js /app/
COPY package.json package-lock.json /app/ 
COPY signUp.db /app/
WORKDIR /app
RUN npm install
RUN npm cache clean --force
CMD node app.js

