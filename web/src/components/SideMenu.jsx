import { useState, useEffect } from 'react'
import { Menu, Layout } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  MonitorOutlined,
  UserOutlined,
  SettingOutlined,
  AppstoreOutlined,
  BoxPlotOutlined,
  FileOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import '../assets/styles/SideMenu.css'

const { Sider } = Layout

function SideMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [currentKey, setCurrentKey] = useState('/dashboard')

  useEffect(() => {
    setCurrentKey(location.pathname)
  }, [location.pathname])

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/system',
      icon: <MonitorOutlined />,
      label: '系统监控',
      onClick: () => navigate('/system')
    }
  ]

  const handleResize = () => {
    // 根据屏幕宽度自动折叠菜单
    setCollapsed(window.innerWidth < 768)
  }

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Sider
      width={256}
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      theme="light"
      className="side-menu"
    >
      <div className="logo-container">
        <div className={`logo ${collapsed ? 'collapsed' : ''}`}>
          <AppstoreOutlined />
          {!collapsed && <span>Ubuntu Panel</span>}
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[currentKey]}
        items={menuItems}
        className="main-menu"
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  )
}

export default SideMenu