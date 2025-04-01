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
import { JSDOM } from 'jsdom';

// Load environment variables
dotenv.config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

const GEMINI_API_KEY = process.env.APIKEY

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" })
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" })


// this
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

// or this
var model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

const config = {
  max_output_tokens:8192, temperature:0.4, top_p:1, top_k:32
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
let htmlContent = ``

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
11. **Avoid including images in the response.**
12. **Make sure the website is single paged with no redirects.**

### Example Requests:
**A website for a rock climber**  
- **Theme:** Adventurous, dark mode, energetic  
- **Sections:** About Me, Climbing Adventures, Social Media Links  
- **Colors:** Dark backgrounds with bright contrast for headings  
- **Typography:** Bold, modern fonts that evoke excitement   
- **Layout:** One-page scrolling with parallax effects  
- **Additional Features:** Smooth transitions, hover effects on images  

Ensure the design captures the thrill of rock climbing.  

### IMPORTANT:  
- The response **must only contain a valid JSON object**.  
- Do **not** include explanations, additional text, or formatting outside JSON.  
- Ensure all HTML tags and CSS rules are valid and properly formatted.  
- Follow all specified formatting rules, including **\\n for new lines** and **single quotes ' inside HTML attributes, not around entire lines.**  
- **DO NOT add unnecessary single quotes ' at the start or end of lines or newlines.**  

`;

const first_config = {
  max_output_tokens:1024, temperature:0.4, top_p:1, top_k:32
}


async function makeGeminiCall(text, retryCount = 3) {
  console.log('makeGeminiCall was called');

  const first_prompt = `Create a website design with the following specifications:  

  - **Theme:** [Describe the overall aesthetic and mood]  
  - **Sections:** [List the key sections required]  
  - **Colors:** [Specify primary and accent colors]  
  - **Typography:** [Mention font preferences if any]  
  - **Layout:** [Mention grid-based, single-page, multi-page, etc.]  
  - **Additional Features:** [Specify animations, effects, interactivity]  

  ### IMPORTANT: 
      - Ensure the design is visually engaging and aligns with the given theme.
      - Avoid including images.
      - Do **not** include explanations, additional text, or formatting outside the specified format.
      - Always keep in mind color contrast of text with background, if background is dark, use light text and vice versa.

  Now give reply for this request:
  `;

  try {
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const first_result = await model.generateContent(first_prompt + text, first_config);
    const first_response = first_result.response.text();
    console.log(first_response)

    const completed_prompt = prompt + `Now, generate the JSON response for the following request:  
  "${first_response}"`;


    // model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(completed_prompt, config);
    const response = result.response.text();
    console.log(response);

    const sliced_res = response.slice(8, response.length - 4); // Ensure this slicing logic is valid

    let json_resp;
    try {
      json_resp = JSON.parse(sliced_res);
    } catch (error) {
      console.error("JSON parsing failed:", error.message);
      if (retryCount > 0) {
        console.log(`Retrying... (${retryCount} attempts left)`);
        return makeGeminiCall(text, retryCount - 1);
      } else {
        throw new Error("Max retries reached. JSON parsing failed.");
      }
    }

    console.log(json_resp);
    if (!json_resp['cssUpdates']) {
      console.log("CSS update doesn't exist for some reason");
    }

    htmlContent = json_resp['html']
    // htmlContent = makeAllEditable(htmlContent)

    updateHtmlAndCss(htmlContent, json_resp['cssUpdates']);

  } catch (error) {
    console.error("Error in makeGeminiCall:", error.message);
  }
}

const makeAllEditable = (htmlString) => {
  const dom = new JSDOM(htmlString);
  const { document } = dom.window;
  
  // Select all elements that can have contenteditable
  document.querySelectorAll('div, p, span, td, section, article, header, footer, aside, h1, h2, h3, h4, h5, h6')
      .forEach(el => el.setAttribute('contenteditable', 'true'));
  
  return dom.serialize();
};
async function changeStyleGemini(text) {
  console.log('changestylegemini was called')
  const extra_instructions = ` This is the website i have now. Only change what i tell you to. Do **not** include explanations, additional text, or formatting outside of the html with tailwind. Now make the changes I ask you to.  ${text}`
  console.log(htmlContent + extra_instructions)
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const result = await model.generateContent(htmlContent + extra_instructions, config);
  const response = result.response.text()
  const sliced_res = response.slice(8, response.length - 4)
  htmlContent = sliced_res

  console.log("updated: -----------------------------------------------")
  // htmlContent = makeAllEditable(htmlContent)
  console.log(htmlContent)
  io.emit('htmlUpdated', { htmlContent });

}

async function makeEcommerceCall(ecommerceInstructions) {
  console.log('makeEcommerceCall was called');
  const ecommerce = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShopMate - Your Online Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    
    <!-- Top Navigation Bar -->
    <nav class="bg-gray-900 text-white p-3 flex justify-between items-center">
        <h1 class="text-xl font-bold">ShopMate</h1>
        <div class="flex-grow mx-4">
            <input type="text" placeholder="Search for products..." class="w-full p-2 rounded-md text-black">
        </div>
        <div class="flex space-x-4">
            <a href="#" class="text-white">Account</a>
            <a href="#" class="text-white">Orders</a>
            <a href="#" class="text-white">Cart</a>
        </div>
    </nav>
    
    <!-- Category Navigation -->
    <div class="bg-white p-3 shadow-md flex justify-center space-x-6 text-gray-700">
        <a href="https://www.amazon.in/s?k=electronics" target="_blank" class="hover:text-blue-500">Electronics</a>
        <a href="https://www.amazon.in/s?k=fashion" target="_blank" class="hover:text-blue-500">Fashion</a>
        <a href="https://www.amazon.in/s?k=home+kitchen" target="_blank" class="hover:text-blue-500">Home & Kitchen</a>
        <a href="https://www.amazon.in/s?k=mobiles" target="_blank" class="hover:text-blue-500">Mobiles</a>
        <a href="https://www.amazon.in/s?k=books" target="_blank" class="hover:text-blue-500">Books</a>
        <a href="https://www.amazon.in/s?k=more" target="_blank" class="hover:text-blue-500">More</a>
    </div>
    
    <!-- Hero Section -->
    <section class="w-full bg-purple-200 p-6 flex justify-between items-center">
        <div>
            <h2 class="text-3xl font-bold">Home Shopping Spree</h2>
            <p class="text-lg">Lowest prices of the year on Home, Kitchen & Outdoor</p>
            <a href="https://www.amazon.in/s?k=home+kitchen" target="_blank" class="bg-yellow-500 text-black px-4 py-2 mt-2 rounded-md inline-block">Shop Now</a>
        </div>
        <img src="https://via.placeholder.com/300" alt="Promo" class="rounded-md">
    </section>
    
    <!-- Featured Categories -->
    <section class="p-8">
        <h3 class="text-2xl font-semibold mb-4">Popular Categories</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 shadow-md text-center rounded-md">
                <h4 class="font-semibold"><a href="https://www.amazon.in/s?k=appliances" target="_blank">Appliances</a></h4>
            </div>
            <div class="bg-white p-4 shadow-md text-center rounded-md">
                <h4 class="font-semibold"><a href="https://www.amazon.in/s?k=home+decor" target="_blank">Home Decor</a></h4>
            </div>
            <div class="bg-white p-4 shadow-md text-center rounded-md">
                <h4 class="font-semibold"><a href="https://www.amazon.in/s?k=headphones" target="_blank">Headphones</a></h4>
            </div>
            <div class="bg-white p-4 shadow-md text-center rounded-md">
                <h4 class="font-semibold"><a href="https://www.amazon.in/s?k=automotive" target="_blank">Automotive</a></h4>
            </div>
        </div>
    </section>
    
    <!-- Product Grid -->
    <main class="p-8">
        <h3 class="text-2xl font-semibold mb-4">Deals of the Day</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div class="bg-white shadow-md rounded-lg p-4">
                <img src="https://via.placeholder.com/150" class="w-full h-40 object-cover rounded-md" alt="Product">
                <h4 class="text-lg font-semibold mt-2">Smartphone</h4>
                <p class="text-gray-600">Starting at ₹4999</p>
                <a href="https://www.amazon.in/s?k=smartphone" target="_blank" class="mt-2 w-full block bg-blue-500 text-white py-2 rounded-md text-center">Shop Now</a>
            </div>
            <div class="bg-white shadow-md rounded-lg p-4">
                <img src="https://via.placeholder.com/150" class="w-full h-40 object-cover rounded-md" alt="Product">
                <h4 class="text-lg font-semibold mt-2">Refrigerators</h4>
                <p class="text-gray-600">Up to 55% Off</p>
                <a href="https://www.amazon.in/s?k=refrigerators" target="_blank" class="mt-2 w-full block bg-blue-500 text-white py-2 rounded-md text-center">Shop Now</a>
            </div>
            <div class="bg-white shadow-md rounded-lg p-4">
                <img src="https://via.placeholder.com/150" class="w-full h-40 object-cover rounded-md" alt="Product">
                <h4 class="text-lg font-semibold mt-2">Headphones</h4>
                <p class="text-gray-600">Starting ₹149</p>
                <a href="https://www.amazon.in/s?k=headphones" target="_blank" class="mt-2 w-full block bg-blue-500 text-white py-2 rounded-md text-center">Shop Now</a>
            </div>
            <div class="bg-white shadow-md rounded-lg p-4">
                <img src="https://via.placeholder.com/150" class="w-full h-40 object-cover rounded-md" alt="Product">
                <h4 class="text-lg font-semibold mt-2">Home Decor</h4>
                <p class="text-gray-600">Latest Designs</p>
                <a href="https://www.amazon.in/s?k=home+decor" target="_blank" class="mt-2 w-full block bg-blue-500 text-white py-2 rounded-md text-center">Shop Now</a>
            </div>
        </div>
    </main>
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white text-center p-4 mt-8">
        <p>&copy; 2025 ShopMate. All Rights Reserved.</p>
    </footer>
</body>
</html>`
const ecommercePrompt = ` The code given above is a base ecommerce website. I want you to modify this website with the following changes. `
const ecommerceRules = ` You are an AI that generates JSON-formatted updates for a website. Your response must always be a JSON object in this exact structure: {
  "type": "both",  
  "html": "<!-- Full HTML content here. IT MUST BE IN A SINGLE LINE, NO MULTI LINE REPLY. -->",
  "cssUpdates": [
    { "property": "border-width" }
  ]
}

### Formatting Rules:
1. **Since the reply is in JSON, the entire html part must be single lined.**
2. **Do not use any characters that would break the json.**
3. The **"html"** field should contain a full structured website with proper indentation.  
4. The **cssUpdates** array should not be modified in any way. 
5. The colors and design should match the theme specified in the request.  
6. Make the website unique, engaging, and include personality where needed.  
7. **Do NOT include explanations or text outside of the JSON response.**  
8. All products and categories should redirect to amazon with product or category in search bar`



var finalPrompt = ecommerceRules + ecommerce + ecommercePrompt + ecommerceInstructions
console.log(finalPrompt)
model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(finalPrompt, config);
    const response = result.response.text();
    console.log(response);

    const sliced_res = response.slice(8, response.length - 4); // Ensure this slicing logic is valid

    let json_resp;
    try {
      json_resp = JSON.parse(sliced_res);
    } catch (error) {
      console.error("JSON parsing failed:", error.message);
      if (retryCount > 0) {
        console.log(`Retrying... (${retryCount} attempts left)`);
        return makeEcommerceCall(text, ecommerceInstructions, retryCount - 1);
      } else {
        throw new Error("Max retries reached. JSON parsing failed.");
      }
    }

    console.log(json_resp);
    if (!json_resp['cssUpdates']) {
      console.log("CSS update doesn't exist for some reason");
    }

    htmlContent = json_resp['html']
    // htmlContent = makeAllEditable(htmlContent)

    updateHtmlAndCss(htmlContent, json_resp['cssUpdates']);

}

// Route to receive text from frontend
app.post("/send-text", (req, res) => {
  const { text, changeStyles, currentButton } = req.body;
  console.log(req.body)
  console.log("Received text:", text);
  console.log("type of changestyles: " + typeof changeStyles)
  console.log("Change in style: " + changeStyles)
  res.json({ message: "Text received successfully", receivedText: text });
  if (changeStyles == true) {
    changeStyleGemini(text)
  } 
  else if (currentButton == 'ecommerce') {
      makeEcommerceCall(text)

  }
  else {
    makeGeminiCall(text, currentButton)
  }
  
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
  
    // Convert CSS updates array into a formatted CSS string
    const newCssContent = cssUpdates
      .map(update => `${update.selector} { ${update.property}: ${update.value}; }`)
      .join('\n');
  
    // Overwrite the CSS file with new content (wiping previous contents)
    fs.writeFile(cssFilePath, newCssContent, 'utf8', (writeErr) => {
      if (writeErr) return res.status(500).json({ error: 'Error writing CSS file.' });
  
      io.emit('cssUpdated', { timestamp: Date.now() });
      cssUpdated = true;
  
      if (htmlUpdated) {
        res.json({ message: 'Both HTML and CSS updated successfully.' });
      } else {
        res.json({ message: 'CSS updated successfully.' });
      }
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
