import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Đổi đuôi import từ .jsx sang .tsx hoặc bỏ đuôi nếu cấu hình resolve tốt
import App from './App'

// Thêm dấu '!' sau getElementById để khẳng định phần tử không null
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)