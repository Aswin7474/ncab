const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

const API_KEY = process.env.GEMINI_API_KEY
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const clientDir = path.join(__dirname, '..', 'client', 'src');
const cssFilePath = path.join(clientDir, 'App.css');

fs.writeFile(cssFilePath, '', (err) => {
  if (err) {
    console.error("Error creating/overwriting existing css file", err)
    return;
  }
})

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
function updateCssRules(cssContent, updates) {
  updates.forEach(({ selector, property, value }) => {
    const regex = new RegExp(`${selector}\\s*{[^}]*}`, 'g');
    const newRule = `${selector} { ${property}: ${value}; }`;
    cssContent = cssContent.match(regex) ? cssContent.replace(regex, newRule) : cssContent + '\n' + newRule;
  });
  return cssContent;
}

app.post('/update', (req, res) => {
  const { type, html, cssUpdates } = req.body;

  if (!type || (type !== 'html' && type !== 'css' && type !== 'both')) {
    return res.status(400).json({ error: 'Invalid type. Use "html", "css", or "both".' });
  }

  let htmlUpdated = false;
  let cssUpdated = false;

  // **HTML Update Handling**
  if (type === 'html' || type === 'both') {
    if (!html) return res.status(400).json({ error: 'Missing HTML content.' });

    // **Sanitize HTML to prevent XSS & escape problematic characters**
    let cleanHtml = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'source', 'iframe']),
        allowedAttributes: {
            a: ['href', 'name', 'target'],
            img: ['src', 'alt'],
            video: ['controls', 'src'],
            source: ['src', 'type'],
            iframe: ['src', 'allowfullscreen'],
            '*': ['class', 'id', 'style']
        },
        allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
    });

    cleanHtml = cleanHtml.replace(/\n/g, ''); // Removes new line characters

    htmlContent = cleanHtml; // Store sanitized HTML
    io.emit('htmlUpdated', { htmlContent });
    htmlUpdated = true;
}


  // **CSS Update Handling**
  if (type === 'css' || type === 'both') {
    if (!Array.isArray(cssUpdates) || cssUpdates.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid CSS updates.' });
    }

    fs.readFile(cssFilePath, 'utf8', (readErr, cssContent) => {
      if (readErr) return res.status(500).json({ error: 'Error reading CSS file.' });

      const updatedCss = updateCssRules(cssContent, cssUpdates);

      fs.writeFile(cssFilePath, updatedCss, 'utf8', (writeErr) => {
        if (writeErr) return res.status(500).json({ error: 'Error writing CSS file.' });

        io.emit('cssUpdated', { timestamp: Date.now() });
        cssUpdated = true;

        if (htmlUpdated) {
          res.json({ message: 'Both HTML and CSS updated successfully.' });
        } else {
          res.json({ message: 'CSS updated successfully.' });
        }
      });
    });
    return;
  }

  if (htmlUpdated) {
    res.json({ message: 'HTML updated successfully.' });
  }
});

// Send the current HTML when a client connects
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('htmlUpdated', { htmlContent }); // Send initial HTML on connect
});

server.listen(3000, () => console.log('Server running on port 3000'));
