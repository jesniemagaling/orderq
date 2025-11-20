# Use lightweight Node
FROM node:20-alpine

WORKDIR /app

# Copy package files first (cache optimization)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining project files
COPY . .

# Expose Vite port
EXPOSE 5174

# Run Vite dev server on host 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
