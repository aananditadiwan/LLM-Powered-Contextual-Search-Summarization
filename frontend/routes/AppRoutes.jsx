import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import FileUploadSearch from "../src/pages/FileUploadSearch";

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<FileUploadSearch />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
