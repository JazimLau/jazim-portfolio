import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { PlaybackProvider } from './context/PlaybackContext'
import { UIProvider } from './context/UIContext'

// 样式加载顺序：重置 → 令牌 → 字体 → 全局工具类
import './styles/reset.css'
import './styles/variables.css'
import './styles/typography.css'
import './styles/global.css'

const container = document.getElementById('root')
if (!container) throw new Error('找不到 #root 容器')

createRoot(container).render(
  <StrictMode>
    {/* HashRouter：构建产物可在本地双击直接打开（file:// 协议下无需服务器路由） */}
    <HashRouter>
      <PlaybackProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </PlaybackProvider>
    </HashRouter>
  </StrictMode>
)
