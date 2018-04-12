 # Create image based on the official Node 8 image from the dockerhub
FROM node:0.12

RUN npm install -g nodemon@1.11.0

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package.json /usr/src/app
COPY npm-shrinkwrap.json /usr/src/app

# Install dependencies
RUN npm install

# Get all the code needed to run the app
COPY . /usr/src/app

# Expose the port the app runs in
EXPOSE 4000


# Serve the app
CMD ["./node_modules/.bin/grunt","rund"]
