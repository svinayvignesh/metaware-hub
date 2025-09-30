/**
 * Application Entry Point
 * 
 * This file initializes the MetaWare React application with all necessary providers:
 * - Apollo Client for GraphQL data management
 * - React Router for navigation
 * - Theme and styling configuration
 * 
 * @author MetaWare Development Team
 * @version 1.0.0
 */

import { createRoot } from "react-dom/client";
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './lib/apollo-client';
import App from "./App.tsx";
import "./index.css";

/**
 * Root application component wrapped with necessary providers
 * 
 * Provider hierarchy:
 * 1. ApolloProvider: Enables GraphQL functionality throughout the app
 * 2. App: Main application component with routing and layout
 */
createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={apolloClient}>
    <App />
  </ApolloProvider>
);
