const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

const clientDir = path.join(__dirname, '..', 'client', 'src');
const cssFilePath = path.join(clientDir, 'App.css');

// Store the current HTML content dynamically
let htmlContent = `
  <div id="container">
    <h1>Container 1</h1>
    <div id="inner-container">
      <h1>Container 2</h1>
      <h1 id="title">Welcome to My Website</h1>
    </div>
  </div>
`;

// Function to update CSS rules in the file
function updateCssRule(cssContent, selector, property, value) {
  const regex = new RegExp(`${selector}\\s*{[^}]*}`, 'g');
  const newRule = `${selector} { ${property}: ${value}; }`;
  return cssContent.match(regex) ? cssContent.replace(regex, newRule) : cssContent + '\n' + newRule;
}

// Handle CSS & HTML updates via POST request
app.post('/update', (req, res) => {
  const { type, html, selector, property, value } = req.body;

  if (type === 'css') {
    fs.readFile(cssFilePath, 'utf8', (readErr, cssContent) => {
      if (readErr) return res.status(500).send('Error reading CSS file');

      const updatedCss = updateCssRule(cssContent, selector, property, value);

      fs.writeFile(cssFilePath, updatedCss, 'utf8', (writeErr) => {
        if (writeErr) return res.status(500).send('Error writing CSS file');

        io.emit('cssUpdated', { timestamp: Date.now() });
        res.send('CSS updated successfully');
      });
    });

  } else if (type === 'html') {
    if (!html) {
      return res.status(400).send('Missing "html" field in request body');
    }

    // Replace the entire HTML content dynamically
    htmlContent = html;

    // Emit updated HTML to all connected clients
    io.emit('htmlUpdated', { htmlContent });

    res.send('HTML updated successfully');
  } else {
    res.status(400).send('Invalid type');
  }
});

// Send the current HTML when a client connects
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('htmlUpdated', { htmlContent }); // Send initial HTML on connect
});

server.listen(3000, () => console.log('Server running on port 3000'));
