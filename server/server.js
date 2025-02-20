const express = require("express");
const http = require('http');
const path = require("path");
const socketIo = require('socket.io');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: '*', // In production, set this to your React app's origin
      methods: ['GET', 'POST']
    }
});

app.use(express.json());
app.use(cors());

const clientDir = path.join(__dirname, '..', 'client', 'src');
const cssFilePath = path.join(clientDir, 'App.css');
console.log(cssFilePath)

function updateCssRule(cssContent, selector, property, value) {
    const regex = new RegExp(`(${selector}\\s*{[^}]*?)(${property}\\s*:\\s*[^;]+;)`, 'i');
    if (regex.test(cssContent)) {
      return cssContent.replace(regex, `$1${property}: ${value};`);
    } else {
      return cssContent + `\n${selector} { ${property}: ${value}; }`;
    }
  }

app.post('/update', (req, res) => {
const { action, selector, property, value } = req.body;
if (action !== 'updateStyle' || !selector || !property || !value) {
    return res.status(400).send('Invalid command');
}

fs.readFile(cssFilePath, 'utf8', (readErr, cssContent) => {
    if (readErr) {
    console.error('Error reading CSS file:', readErr);
    return res.status(500).send('Error reading CSS file');
    }

    const updatedCss = updateCssRule(cssContent, selector, property, value);

    fs.writeFile(cssFilePath, updatedCss, 'utf8', (writeErr) => {
    if (writeErr) {
        console.error('Error writing CSS file:', writeErr);
        return res.status(500).send('Error writing CSS file');
    }

    // Broadcast the update to all connected clients
    io.emit('cssUpdate', { selector, property, value });
    res.send('CSS updated successfully');
    });
});
});

app.get('/check', (req, res) => {
    res.json({message: "it worked"});
})


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

