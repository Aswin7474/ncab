import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Send } from 'lucide-react';
import LoadingAnimation from './loading';
import './App.css';

const socket = io('http://localhost:3000');

function App() {
  const [typeToGetStarted, setTypeToGetStarted] = useState(true);
//   const [header, setHeader] = useState(`
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>No-Code AI Builder</title>
//     <script src="https://cdn.tailwindcss.com"></script>
// </head>
// <body class="bg-gray-50 min-h-screen">
// <header class="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 bg-white shadow-md">
//     <h1 class="text-3xl font-extrabold text-blue-600">No-Code AI Builder</h1>
// </header>
// </body>
// </html>
//   `);
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
    <div 
      className="flex flex-col h-screen" 
      style={{
        backgroundImage: 'url("./background.png")', // Adding background image
        backgroundSize: 'cover', // Ensuring the background covers the entire screen
        backgroundPosition: 'center', // Centering the background image
      }}
    >
      {/* Main Content - Centering Content */}
      <div
        id="main-content"
        // className="flex-grow w-full bg-[#a11cad] shadow-lg flex items-center justify-center overflow-auto relative"
        className="flex-grow w-full shadow-lg flex items-center justify-center overflow-auto relative"
        style={{
          height: "calc(100vh - 4rem - 4rem)",
        }}
      >
        {typeToGetStarted ? (
          <>
            <div className="absolute left-4 top-0  p-6 text-left w-96 flex flex-col justify-center h-50">
              <div className="flex flex-col p-6  shadow-lg bg-[#1f0d68] h text-xl text-white leading-relaxed">
                <div id="instructions" className="text-2xl font-bold">Instructions:</div>
                <div className="flex flex-col items-start mt-4 space-y-4 text-lg">
                  <p>1. Type your message in the input field at the bottom.</p>
                  <p>2. Press Enter or click the Send button to send your message.</p>
                  <p>3. Use the "Make Changes" checkbox to adjust the appearance of the content.</p>
                </div>
                <div className="w-full border-t-4 border-white my-6"></div>
                <div className="text-2xl font-bold">Benefits:</div>
                <div className="flex flex-col items-start mt-4 space-y-4 text-lg">
                  <p>1. Easily send and view messages in real-time.</p>
                  <p>2. Control the appearance of your content with the style toggle.</p>
                  <p>3. See immediate changes or responses without page reloads.</p>
                </div>
              </div>
            </div>
            <div className="p-6 pt-[300px] pl-[8.5vw] text-center">
              <h2 className="text-[72px] font-semibold text-white">
                NO CODE AI <br /> BUILDER
              </h2>
            </div>

          </>
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
        className="fixed bottom-0 w-full bg-transparent shadow-md p-4 flex items-center justify-between"
        style={{ height: "4rem" }}
      >
        <div className="w-full max-w-4xl mx-auto pl-64 pr-8 p-12">
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
          <label htmlFor="changeStyles" className="font-semibold text-white">Make Changes</label>
        </div>
      </div>
    </div>
  );
  
}



export default App;
