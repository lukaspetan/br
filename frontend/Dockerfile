FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY public/ ./public/
COPY src/ ./src/
COPY *.html ./
COPY *.config.* ./
COPY tailwind.config.js postcss.config.js ./

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/public/landing.html /usr/share/nginx/html/landing.html
COPY --from=builder /app/public/vortex.svg /usr/share/nginx/html/vortex.svg
COPY --from=builder /app/dist /usr/share/nginx/html/app

RUN echo 'server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Landing page estática
    location = / {
        rewrite ^ /landing.html;
    }

    location / {
        try_files $uri $uri/ /app/index.html;
    }

    # SPA routing
    location /app {
        alias /usr/share/nginx/html/app;
        try_files $uri $uri/ /app/index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection '"'"'upgrade'"'"';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
