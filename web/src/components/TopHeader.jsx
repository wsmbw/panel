import { useEffect, useState } from 'react'
import { Layout, Typography, Avatar, Dropdown, Button, message } from 'antd'
import { UserOutlined, DownOutlined, LogoutOutlined, QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import '../assets/styles/TopHeader.css'

const { Header } = Layout
const { Text } = Typography

function TopHeader({ user, onLogout }) {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // 更新当前时间
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // 格式化时间
  const formatTime = (date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />
    },
    {
      key: 'settings',
      label: '账号设置',
      icon: <SettingOutlined />,
      onClick: () => message.info('功能开发中')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        onLogout()
        navigate('/login')
      }
    }
  ]

  return (
    <Header className="top-header">
      <div className="header-content">
        <div className="header-left">
          <Text className="system-time">{formatTime(currentTime)}</Text>
        </div>
        
        <div className="header-right">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            className="header-btn"
          >
            帮助
          </Button>
          
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div className="user-info" onClick={(e) => e.preventDefault()}>
              <Avatar icon={<UserOutlined />} className="user-avatar" />
              <span className="user-name">{user?.username || '未知用户'}</span>
              <DownOutlined className="user-arrow" />
            </div>
          </Dropdown>
        </div>
      </div>
    </Header>
  )
}

export default TopHeader