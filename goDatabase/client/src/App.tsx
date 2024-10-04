import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

// Define the User interface to include an email
interface User {
  email: string; // Use the correct field name as per your API response
}

function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User | null>(null); // State with the User interface or null

  useEffect(() => {
    fetch('http://localhost:3000/api/userCookieInfo', { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Received data:', data); // Log to see what's received
        setUser(data); // Set the entire user object
      })
      .catch(error => {
        console.error('Error fetching user info:', error);
      });
  }, []); // Empty dependency array means this effect runs once after the first render

  const handleLogin = () => {
    const authUrl = import.meta.env.VITE_AUTH_URL || "localhost:3000/api/auth/google";
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    const logoutURL = import.meta.env.VITE_LOGOUT_URL|| "localhost:3000/api/logout/google";
    window.location.href = logoutURL;
  };


  return (
    <div className="App">
      <header className="App-header">
        <img src={viteLogo} className="App-logo" alt="logo" />
        <img src={reactLogo} className="App-logo react" alt="logo" />
        <p>Vite + React</p>
        {user ? (
          <div>
            <h2>Welcome, {user.email}!</h2>
            <div className="card">
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
              <p>Edit <code>src/App.tsx</code> and save to test HMR updates.</p>
            <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        ) : (
          <div>
            <h2>You are not logged in.</h2>
            <button onClick={handleLogin}>Login With Google</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

