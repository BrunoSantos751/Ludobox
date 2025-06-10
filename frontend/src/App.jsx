import { useState } from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './components/Home/Home';
import Register from './components/Register/Register';
import Catalogo from './components/Catalogo/Catalogo'
import Login from './components/Login/Login'

function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
          <Route path='/' element={<Home />}/>
          <Route path='/register' element={<Register />} />
          <Route path='/catalogo' element={<Catalogo />}/>
          <Route path='/login' element={<Login />}/>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
