const express = require('express');
const path = require('path');
require('dotenv').config();

const projectResourcesServer = express();
const projectResourcesDir = path.join("C:/Users/srira/AppData/Roaming/genie/projects");


//Serve media files from the media directory
projectResourcesServer.use('/media', express.static(projectResourcesDir));

const port = process.env.MEDIA_PORT || 3000;
let server = projectResourcesServer.listen(port, () => {
    console.log(`projectResourcesServer server is running at http://localhost:${port}/media`);
});

// Handle termination signals
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down server...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});


