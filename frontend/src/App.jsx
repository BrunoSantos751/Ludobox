import { useState } from 'react';
import Home from './components/Home/Home';
import Register from './components/Register/Register';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <>
      {currentPage === 'home' && <Home onEntrarClick={() => setCurrentPage('register')} />}
      {currentPage === 'register' && <Register />}
    </>
  );
}

export default App;
