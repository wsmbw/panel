import { useState } from 'react'
import { Card, Form, Input, Button, message, Typography, Divider } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import axios from 'axios'
import '../assets/styles/Login.css'

const { Title } = Typography

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values) => {
    try {
      setLoading(true)
      // 模拟环境中直接使用测试数据登录
      // 实际项目中应该调用真实的API
      // const response = await axios.post('/api/auth/login', values)
      // const { token, user } = response.data
      
      // 测试登录功能
      const mockUser = {
        id: 1,
        username: values.username,
        name: values.username === 'admin' ? '系统管理员' : '测试用户',
        role: values.username === 'admin' ? 'admin' : 'user'
      }
      const mockToken = 'mock-token-' + Date.now()
      
      onLogin(mockUser, mockToken)
    } catch (error) {
      message.error('登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-form">
        <Title level={2} className="login-title">Ubuntu Panel</Title>
        <Divider />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-button"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login