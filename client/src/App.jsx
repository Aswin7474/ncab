import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Send } from 'lucide-react';
import LoadingAnimation from './loading';
import './App.css';

const socket = io('http://localhost:3000');

function App() {
  const [typeToGetStarted, setTypeToGetStarted] = useState(true);
  const [header, setHeader] = useState(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>No-Code AI Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
<header class="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 bg-white shadow-md">
    <h1 class="text-3xl font-extrabold text-blue-600">No-Code AI Builder</h1>
</header>
</body>
</html>
  `);
  const [htmlContent, setHtmlContent] = useState('');
  const [changeStyles, setChangeStyles] = useState(false);
  const [text, setText] = useState("");
  const [loadState, setLoadState] = useState(false)

  useEffect(() => {
    socket.on('cssUpdated', (data) => {
      const { timestamp } = data;
      const cssLink = document.getElementById('main-css');
      if (cssLink) {
        cssLink.setAttribute('href', `/styles.css?v=${timestamp}`);
      }
    });

    socket.on('htmlUpdated', ({ htmlContent }) => {
      console.log(htmlContent);
      setLoadState(false);
      setHtmlContent(htmlContent);


      console.log(`load state: ${loadState}`)
      console.log(`Type to get started: ${typeToGetStarted}`)
    });

    return () => {
      socket.off('cssUpdated');
      socket.off('htmlUpdated');
    };
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return; // Prevent sending empty messages
    try {

      setTypeToGetStarted(false); 
      setLoadState(true)
      const response = await axios.post("http://localhost:3000/send-text", { text, changeStyles });
      console.log(response.data);
      setText(""); // Clear the input field after sending

      console.log(`load state: ${loadState}`)
      console.log(`Type to get started: ${typeToGetStarted}`)
      console.log(`changeStyles: ${changeStyles}`)


    } catch (error) {
      console.error("Error sending text:", error);
    }
  };
  return (
    <div className="flex flex-col h-screen">
      {/* Header - Fixed height */}
      <div
        id="header"
        className="flex-none p-4 bg-white shadow-md"
        style={{ height: "4rem" }}
        dangerouslySetInnerHTML={{ __html: header }}
      />
  
      {/* Main Content - Centering Content */}
      <div
        id="main-content"
        className="flex-grow w-full bg-gray-200 shadow-lg flex items-center justify-center overflow-auto"
        style={{
          height: "calc(100vh - 4rem - 4rem)", // Ensures it does not go under header/footer
        }}
      >
        {typeToGetStarted ? (
          <div className="p-6 bg-white shadow-lg rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Start typing below to get started
            </h2>
          </div>
        ) : loadState ? (
          <LoadingAnimation />
        ) : (
          <div
            id="generated-website"
            className="w-full h-full overflow-auto"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
  
      {/* Footer - Fixed at Bottom */}
      <div
        className="fixed bottom-0 w-full bg-white shadow-md p-4 flex items-center justify-between"
        style={{ height: "4rem" }}
      >
        <div className="w-full max-w-2xl mx-auto p-4">
          <div className="flex items-center bg-white border border-gray-300 rounded-2xl p-3 shadow-md focus-within:ring-2 focus-within:ring-blue-500">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-grow outline-none bg-transparent text-gray-900 text-base px-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()} // Allow sending with Enter
            />
            <button
              onClick={sendMessage}
              className="p-2 text-blue-500 hover:text-blue-600 transition"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="changeStyles" 
            checked={changeStyles} 
            onChange={() => setChangeStyles(!changeStyles)} 
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-300"
          />
          <label htmlFor="changeStyles" className="text-gray-700 font-medium">Make Changes</label>
        </div>
      </div>
    </div>
  );
}




export default App;
