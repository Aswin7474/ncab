import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';
import ChatInput from './searchbar';

const socket = io('http://localhost:3000');

function App() {
  const [defaultHtmlContent, setDefaultHtmlContent] = useState(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>No-Code AI Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <header class="flex justify-between items-center px-8 py-4 bg-white shadow-md">
        <h1 class="text-3xl font-extrabold text-blue-600">No-Code AI Builder</h1>
        <button class="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">Log In</button>
    </header>
</body>
</html>
`);
  const [htmlContent, setHtmlContent] = useState('');
  const [changeStyles, setChangeStyles] = useState(false);

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
      setHtmlContent(htmlContent);
    });

    return () => {
      socket.off('cssUpdated');
      socket.off('htmlUpdated');
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div
        id="defaultLandingPage"
        className="flex-none p-4"
        dangerouslySetInnerHTML={{ __html: defaultHtmlContent }}
      />
  
      <div
        className="flex-none w-full bg-gray-200 shadow-lg overflow-auto"
        style={{
          height: "calc(100vh - 8rem - 4rem)",
          maxHeight: "calc(100vw * 9 / 16)",
        }}
      >
        {htmlContent === '' ? (
          <div className="mt-12 mx-auto max-w-2xl p-6 bg-white shadow-lg rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Start typing below to get started
            </h2>
          </div>
        ) : (
          <div
            id="generated-website"
            className="w-full h-full overflow-auto"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
  
      <div className="fixed bottom-0 w-full bg-white shadow-md p-4 flex items-center justify-between">
        <ChatInput changeInStyle={changeStyles} />
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="changeStyles" 
            checked={changeStyles} 
            onChange={() => setChangeStyles(!changeStyles)} 
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-300"
          />
          <label htmlFor="changeStyles" className="text-gray-700 font-medium">Change Style</label>
        </div>
      </div>
    </div>
  );
}

export default App;
