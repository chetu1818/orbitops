# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the code and build for production
COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine AS final

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the correct Angular output path
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copy our custom Nginx config to handle Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]