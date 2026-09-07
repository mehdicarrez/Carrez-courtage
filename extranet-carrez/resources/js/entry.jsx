import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './Main';
import './bootstrap';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <Main />
    </React.StrictMode>
);
