import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css'

const socket = io('http://localhost:3000');

function App() {
  
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
      setHtmlContent(htmlContent);
    });

    return () => {
      socket.off('cssUpdated');
      socket.off('htmlUpdated');
    };
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );

}

export default App
