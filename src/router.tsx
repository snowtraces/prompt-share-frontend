import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Prompts from "./pages/Prompts";
import Files from "./pages/Files";

const AppRouter: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/files" element={<Files />} />
      </Routes>
    </Layout>
  );
};

export default AppRouter;
