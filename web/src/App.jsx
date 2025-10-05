import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, message } from 'antd'
import axios from 'axios'

// 导入页面组件
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SystemMonitor from './pages/SystemMonitor.jsx'

// 导入布局组件
import SideMenu from './components/SideMenu.jsx'
import TopHeader from './components/TopHeader.jsx'

const { Content } = Layout

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // 设置axios默认header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // 验证token（实际项目中应该有验证接口）
      // const response = await axios.get('/api/auth/verify')
      // 暂时模拟验证成功
      setIsAuthenticated(true)
      setUser(JSON.parse(localStorage.getItem('user')))
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // 处理登录
  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setIsAuthenticated(true)
    setUser(userData)
    message.success('登录成功')
  }

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setIsAuthenticated(false)
    setUser(null)
    message.success('登出成功')
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>
  }

  return (
    <Layout className="app-layout">
      {isAuthenticated ? (
        <>
          <TopHeader user={user} onLogout={handleLogout} />
          <Layout>
            <SideMenu />
            <Layout className="main-content">
              <Content className="content-wrapper">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/system" element={<SystemMonitor />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </Layout>
  )
}

export default App