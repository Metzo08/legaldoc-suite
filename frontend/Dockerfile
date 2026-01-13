# Étape 1: Build de l'application React
FROM node:18-alpine AS build

WORKDIR /app

# Build argument for API URL
ARG REACT_APP_API_URL=http://localhost:8000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape 2: Serveur de production (Nginx)
FROM nginx:alpine

# Copier le build React vers le dossier Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copier la configuration Nginx personnalisée si nécessaire
# (On utilise celle du service nginx global du docker-compose, 
# mais en avoir une par défaut ici est une bonne pratique)

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
