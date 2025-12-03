import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Prompts from "./pages/Prompts";
import Files from "./pages/Files";
import PromptDetail from './pages/PromptDetail';

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/login", element: <Login /> },
        { path: "/prompts", element: <Prompts /> },
        { path: "/files", element: <Files /> },
        { path: "/prompt/:id", element: <PromptDetail /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;