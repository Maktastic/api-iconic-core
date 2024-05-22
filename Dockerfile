# Use the official Node.js image
FROM node:latest

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using Yarn
RUN npm install

# Rebuild bcrypt
RUN npm rebuild bcrypt --build-from-source

# Copy the rest of the application code
COPY . .

# Expose the application port (adjust if necessary)
EXPOSE 5000 27017

# Start the application (adjust if necessary)
CMD ["npm", "start"]
