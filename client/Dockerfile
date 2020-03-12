#first phase
#tag build step with name builder to reference it afterwards
FROM node:alpine as builder
WORKDIR '/app'
COPY package.json ./
RUN npm install
COPY ./ ./
RUN npm run build

#second phase
FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
#use reference from first line to get access to build output folder 
#and copy it to nginx image
#see nginx image description for static file folder /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html