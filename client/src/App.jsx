import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css'

const socket = io('http://localhost:3000');

function App() {
  // const [styleRules, setStyleRules] = useState({});

  useEffect(() => {
    // Listen for the 'cssUpdated' event from the backend
    socket.on('cssUpdated', (data) => {
      const { timestamp } = data;
      // Force refresh the CSS file by updating the href attribute
      const cssLink = document.getElementById('main-css');
      if (cssLink) {
        // Append a query parameter to bypass the cache
        cssLink.setAttribute('href', `/styles.css?v=${timestamp}`);
      }
    });

    // Cleanup on component unmount
    return () => {
      socket.off('cssUpdated');
    };
  }, []);


  return (
    <div id="container" >
        <h1>Container 1</h1>
        <div id="inner-container" >
            <h1>
                Container 2
            </h1>

        </div>

    </div>
  )
}

export default App
