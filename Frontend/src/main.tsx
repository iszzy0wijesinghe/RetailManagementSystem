import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import AppErrorBoundary from "./components/errors/AppErrorBoundary";


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppErrorBoundary>
      <RouterProvider router={router} />
      </AppErrorBoundary>
    </Provider>
  </React.StrictMode>
);