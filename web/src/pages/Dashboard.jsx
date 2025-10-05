import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Spin, Alert, Button, Tag } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, DatabaseOutlined, UserOutlined, MonitorOutlined, HddOutlined } from '@ant-design/icons'
import axios from 'axios'
import ReactECharts from 'echarts-for-react'
import '../assets/styles/Dashboard.css'

const { Title, Paragraph } = Typography

function Dashboard() {
  const [systemStatus, setSystemStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  // 获取系统状态
  const fetchSystemStatus = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/system/status')
      setSystemStatus(response.data)
      setError(null)
    } catch (err) {
      console.error('获取系统状态失败:', err)
      setError('获取系统状态失败，请检查服务器连接')
      // 使用模拟数据以便演示
      setSystemStatus(getMockSystemStatus())
    } finally {
      setLoading(false)
    }
  }

  // 模拟系统状态数据
  const getMockSystemStatus = () => {
    return {
      cpu: { usage_percent: 35.8, temperature: 45.2 },
      memory: {
        total: 8589934592,
        used: 3221225472,
        free: 5368709120,
        usage_percent: 37.5
      },
      disk: {
        total: 107374182400,
        used: 25165824000,
        free: 82208358400,
        usage_percent: 23.4
      },
      network: [
        {
          name: 'eth0',
          bytes_sent: 104857600,
          bytes_recv: 209715200
        }
      ]
    }
  }

  // 格式化字节数
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    k = 1024
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // CPU使用率图表配置
  const cpuChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      data: [30, 40, 20, 45, 35, 35.8],
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(24, 144, 255, 0.1)'
      },
      lineStyle: {
        color: '#1890ff',
        width: 2
      },
      itemStyle: {
        color: '#1890ff'
      }
    }]
  }

  // 内存使用率图表配置
  const memoryChartOption = {
    tooltip: {
      trigger: 'item'
    },
    series: [{
      name: '内存使用',
      type: 'pie',
      radius: '60%',
      data: [
        { value: systemStatus?.memory?.usage_percent || 37.5, name: '已使用' },
        { value: 100 - (systemStatus?.memory?.usage_percent || 37.5), name: '可用' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Title level={4}>仪表盘</Title>
      
      {error && (
        <Alert
          message="提示"
          description={error}
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={fetchSystemStatus}>重试</Button>
          }
          className="mb-4"
        />
      )}

      {/* 状态卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="CPU使用率"
              value={systemStatus?.cpu?.usage_percent || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<MonitorOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="CPU温度"
              value={systemStatus?.cpu?.temperature || 0}
              precision={1}
              suffix="°C"
              valueStyle={{ 
                color: (systemStatus?.cpu?.temperature || 0) > 70 ? '#cf1322' : 
                       (systemStatus?.cpu?.temperature || 0) > 50 ? '#fa8c16' : '#3f8600' 
              }}
              prefix={<MonitorOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="内存使用"
              value={systemStatus?.memory?.usage_percent || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
              prefix={<DatabaseOutlined />}
              extra={
                <span className="memory-detail">
                  {formatBytes(systemStatus?.memory?.used || 0)} / {formatBytes(systemStatus?.memory?.total || 0)}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="磁盘使用"
              value={systemStatus?.disk?.usage_percent || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
              prefix={<HddOutlined />}
              extra={
                <span className="disk-detail">
                  {formatBytes(systemStatus?.disk?.used || 0)} / {formatBytes(systemStatus?.disk?.total || 0)}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="在线用户"
              value={2}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="CPU使用率趋势" bordered={false} className="chart-card">
            <ReactECharts option={cpuChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="内存使用分布" bordered={false} className="chart-card">
            <ReactECharts option={memoryChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 系统信息 */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24}>
          <Card title="系统概览" bordered={false} className="system-info-card">
            <div className="system-info-content">
              <div className="info-item">
                <span className="info-label">操作系统:</span>
                <Tag color="blue">Ubuntu 22.04 LTS</Tag>
              </div>
              <div className="info-item">
                <span className="info-label">CPU型号:</span>
                <Tag>Intel Core i7-12700K</Tag>
              </div>
              <div className="info-item">
                <span className="info-label">运行时间:</span>
                <Tag color="green">12天 5小时</Tag>
              </div>
              <div className="info-item">
                <span className="info-label">当前服务:</span>
                <Tag color="purple">8 个运行中</Tag>
              </div>
              <div className="info-item">
                <span className="info-label">Docker容器:</span>
                <Tag color="orange">5 个运行中</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard