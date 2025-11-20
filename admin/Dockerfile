# Stage 1 - base
FROM node:20-alpine

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose Vite default port
EXPOSE 5173

# Run Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]