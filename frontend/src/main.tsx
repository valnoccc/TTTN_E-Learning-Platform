import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'swiper/css/swiper.css'
import './process-shim'
import { Provider } from 'react-redux';
import './config/i18n';
import { store } from './store/store';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <App />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
