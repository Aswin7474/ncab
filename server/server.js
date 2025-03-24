import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import sanitizeHtml from 'sanitize-html';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';

// Load environment variables
dotenv.config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.APIKEY

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
const config = {
  max_output_tokens:2048, temperature:0.4, top_p:1, top_k:32
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.join(__dirname, '..', 'client', 'src');
const cssFilePath = path.join(clientDir, 'App.css');

fs.writeFile(cssFilePath, '', (err) => {
  if (err) {
    console.error("Error creating/overwriting existing css file", err)
    return;
  }
})

// Store the current HTML content dynamically
// let htmlContent = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>No-Code AI Builder</title>
//     <script src="https://cdn.tailwindcss.com"></script>
// </head>
// <body class="bg-gray-50 min-h-screen">
//     <!-- Header -->
//     <header class="flex justify-between items-center px-8 py-4 bg-white shadow-md">
//         <!-- Logo -->
//         <h1 class="text-3xl font-extrabold text-blue-600">No-Code AI Builder</h1>
        
//         <!-- Login Button -->
//         <button class="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">Log In</button>
//     </header>
// </body>
// </html>
// `;

let htmlContent = `<h1>Nothing Yet</h1>`

// Function to update CSS rules in the file
function updateCssRules(cssContent, updates) {
  updates.forEach(({ selector, property, value }) => {
    const regex = new RegExp(`${selector}\\s*{[^}]*}`, 'g');
    const newRule = `${selector} { ${property}: ${value}; }`;
    cssContent = cssContent.match(regex) ? cssContent.replace(regex, newRule) : cssContent + '\n' + newRule;
  });
  return cssContent;
}



const prompt = `
You are an AI that generates JSON-formatted updates for a website. Your response must always be a JSON object in this exact structure:

{
  "type": "both",  // Can be "html", "css", or "both"
  "html": "<!-- Full HTML content here. IT MUST BE IN A SINGLE LINE, NO MULTI LINE REPLY. -->",
  "cssUpdates": [
    { "selector": "selector1", "property": "property1", "value": "value1" },
    { "selector": "selector2", "property": "property2", "value": "value2" }
  ]
}

### Formatting Rules:
1. **Since the reply is in JSON, the entire html part must be single lined.**
2. **Do not use any characters that would break the json.**
3. The **"html"** field should contain a full structured website with proper indentation.  
4. The **"cssUpdates"** array should have multiple JSON objects, each updating a specific CSS rule.  
5. The colors and design should match the theme specified in the request.  
6. Make the website unique, engaging, and include personality where needed.  
7. **Do NOT include explanations or text outside of the JSON response.** 
8. **Usage of framework like tailwind is allowed and even encouraged.** 
9. **All website must Header, navigation bar, A hero section, Testimonials, and a Footer.**
10. **Ensure that text remains easily readable by maintaining a strong contrast between the font color and the background. Avoid using dark fonts on dark backgrounds or light fonts on light backgrounds.**

### Example Requests:
1. **A website for a rock climber**  
   - Theme: Adventurous, dark mode, energetic  
   - Include sections: About Me, Climbing Adventures, Social Media Links  
   - Colors: Dark backgrounds, bright contrast for headings  

2. **An online clothing store**  
   - Theme: Modern, minimalistic, dark aesthetic  
   - Include sections: Hero Banner, Featured Products, Contact Us  
   - Colors: Dark shades, neon highlights  

### IMPORTANT:  
- The response **must only contain a valid JSON object**.  
- Do **not** include explanations, additional text, or formatting outside JSON.  
- Ensure all HTML tags and CSS rules are valid and properly formatted.  
- Follow all specified formatting rules, including **\\n for new lines** and **single quotes ' inside HTML attributes, not around entire lines.**  
- **DO NOT add unnecessary single quotes ' at the start or end of lines or newlines.**  

`;

async function makeGeminiCall(text) {
  const completed_prompt = prompt + `Now, generate the JSON response for the following request:  
"${text}}"` 
  const result = await model.generateContent(completed_prompt, config);
  const response = result.response.text()
  // console.log(response)
  const sliced_res = response.slice(8, response.length - 4)
  // console.log(sliced_res)
  const json_resp = JSON.parse(sliced_res)
  updateHtmlAndCss(json_resp['html'], json_resp['cssUpdates'])
}

// Route to receive text from frontend
app.post("/send-text", (req, res) => {
  const { text } = req.body;
  console.log("Received text:", text);
  res.json({ message: "Text received successfully", receivedText: text });
  makeGeminiCall(text)
});


async function updateHtmlAndCss(newHtml, cssUpdates) {
  try {
      const response = await axios.post('http://localhost:3000/update', {
          type: 'both',
          html: newHtml,
          cssUpdates
      });
      console.log('Response:', response.data);
  } catch (error) {
      console.error('Error updating HTML and CSS:', error.response ? error.response.data : error.message);
  }
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

    // Allow full HTML document structure while still sanitizing content
    let cleanHtml = sanitizeHtml(html, {
        allowedTags: false, // Allow full HTML structure, including <!DOCTYPE>
        allowedAttributes: false, // Allow all attributes
        allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
    });

    // cleanHtml = cleanHtml.replace(/\n/g, ''); // Remove new line characters

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
