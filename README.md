# fs2netd-nodejs
This is a reimplementation of the fs2netd server deamon using Node.js

## Installation
In a production environment run
```
npm install --production && npm run deploy
```
That will install all production dependencies and compile and copy all relevant files into 'deploy'. The server can then
be launched with
```
cd deploy && node src/main.js
```