import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css'
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
    <!-- Header -->
    <header class="flex justify-between items-center px-8 py-4 bg-white shadow-md">
        <!-- Logo -->
        <h1 class="text-3xl font-extrabold text-blue-600">No-Code AI Builder</h1>
        
        <!-- Login Button -->
        <button class="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">Log In</button>
    </header>
</body>
</html>
`);
  const [htmlContent, setHtmlContent] = useState('<h1>Loading...</h1>');

  useEffect(() => {
    socket.on('cssUpdated', (data) => {
      const { timestamp } = data;
      const cssLink = document.getElementById('main-css');
      if (cssLink) {
        cssLink.setAttribute('href', `/styles.css?v=${timestamp}`);
      }
    });

    socket.on('htmlUpdated', ({ htmlContent }) => {
      console.log(htmlContent)
      setHtmlContent(htmlContent);
    });

    return () => {
      socket.off('cssUpdated');
      socket.off('htmlUpdated');
    };
  }, []);

  // return (
  //   <div className="flex flex-col h-screen">
  //     {/* Main content area */}
  //     <div id="defaultLandingPage" className="flex-1 overflow-auto" dangerouslySetInnerHTML={{ __html: defaultHtmlContent }} />
  //     {/* 16:9 Aspect Ratio Box */}
  //     <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
  //       <div
  //         id="generated website"
  //         className="absolute top-0 left-0 w-full h-full bg-gray-200"
  //         dangerouslySetInnerHTML={{ __html: htmlContent }}
  //       />
  //     </div>


  //     <div className="fixed bottom-0 w-full bg-white shadow-md p-4">
  //       <ChatInput />
  //     </div>
  //   </div>
  // );

  // return (
  //   <div className="flex flex-col h-screen">
  //     {/* Top Section: Default Landing Page (Scrollable) */}
  //     <div id="defaultLandingPage" className="flex-1 overflow-auto p-4" dangerouslySetInnerHTML={{ __html: defaultHtmlContent }} />
  
  //     {/* Middle Section: Fixed 16:9 Box (Scrollable Content) */}
  //     <div className="fixed left-0 w-full bg-gray-200 shadow-lg overflow-auto" style={{ top: "50%", height: "56.25%", transform: "translateY(-50%)" }}>
  //       <div
  //         id="generated website"
  //         className="w-full h-full overflow-auto"
  //         dangerouslySetInnerHTML={{ __html: htmlContent }}
  //       />
  //     </div>
  
  //     {/* Bottom Section: Fixed Chat Input */}
  //     <div className="fixed bottom-0 w-full bg-white shadow-md p-4">
  //       <ChatInput />
  //     </div>
  //   </div>
  // );

  return (
    <div className="flex flex-col h-screen">
      {/* Top Section: Default Landing Page (Scrollable) */}
      <div id="defaultLandingPage" className="flex-none p-4" dangerouslySetInnerHTML={{ __html: defaultHtmlContent }} />
  
      {/* Middle Section: Dynamically Sized 16:9 Box */}
      <div className="flex-none w-full bg-gray-200 shadow-lg overflow-auto" 
        style={{ 
          height: "calc(100vh - 8rem - 4rem)", // Adjust to fit perfectly
          maxHeight: "calc(100vw * 9 / 16)", // Ensures 16:9 ratio
        }}>
        <div
          id="generated website"
          className="w-full h-full overflow-auto"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
  
      {/* Bottom Section: Fixed Chat Input */}
      <div className="fixed bottom-0 w-full bg-white shadow-md p-4">
        <ChatInput />
      </div>
    </div>
  );
  
  
  


}

export default App
