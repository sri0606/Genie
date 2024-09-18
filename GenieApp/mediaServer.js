const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
let server;

const port = process.env.MEDIA_PORT || 3000;

app.use('/media', express.static("C:/Users/srira/Projects/Genie/GenieApp/mediaDirectory"));

server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Handle termination signals
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});


