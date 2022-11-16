FROM node:18.12.1
ADD public/ /app/public/
ADD views/ /app/views/
COPY app.js /app/
COPY package.json /app/ 
COPY signUp.db /app/
WORKDIR /app
RUN npm install && npm cache clean --force
CMD node app.js

