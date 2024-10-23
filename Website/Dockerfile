# Use the Node.js image
FROM node:20.17

# Set the working directory
WORKDIR /frontend

COPY package.json .

# Install Node.js dependencies
RUN npm install

COPY . .

# Expose the port for your app
EXPOSE 8000

# Run the development server using npx
CMD ["npx", "next", "dev", "-p", "8000"]

