import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "../routes/AppRoutes";
import { toast, ToastContainer } from "react-toastify";

const App = () => {


  return (
    <Router>
      <div className="p-4">
        <AppRoutes />
      </div>
      <ToastContainer autoClose={2000} />
    </Router>
  );
};

export default App;
