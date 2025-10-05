import { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Table, Typography, Spin, Button, Select, Tag } from 'antd'
import { SyncOutlined, EllipsisOutlined, CloseOutlined, PauseCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import ReactECharts from 'echarts-for-react'
import '../assets/styles/SystemMonitor.css'

const { Title } = Typography
const { Option } = Select

function SystemMonitor() {
  const [systemStatus, setSystemStatus] = useState(null)
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [processLoading, setProcessLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('hour')
  const intervalRef = useRef(null)

  useEffect(() => {
    // 初始加载数据
    fetchData()

    // 设置定时刷新
    intervalRef.current = setInterval(() => {
      fetchSystemStatus()
    }, 5000) // 5秒刷新一次系统状态

    return () => {
      // 清理定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // 加载所有数据
  const fetchData = async () => {
    await Promise.all([
      fetchSystemStatus(),
      fetchProcesses()
    ])
    setLoading(false)
  }

  // 获取系统状态
  const fetchSystemStatus = async () => {
    try {
      const response = await axios.get('/api/system/status')
      setSystemStatus(response.data)
    } catch (err) {
      console.error('获取系统状态失败:', err)
      // 使用模拟数据
      setSystemStatus(getMockSystemStatus())
    }
  }

  // 获取进程列表
  const fetchProcesses = async () => {
    setProcessLoading(true)
    try {
      const response = await axios.get('/api/system/processes')
      setProcesses(response.data)
    } catch (err) {
      console.error('获取进程列表失败:', err)
      // 使用模拟数据
      setProcesses(getMockProcesses())
    } finally {
      setProcessLoading(false)
    }
  }

  // 模拟系统状态数据
  const getMockSystemStatus = () => {
    return {
      cpu: { usage_percent: Math.random() * 50 + 10, temperature: Math.random() * 30 + 40 },
      memory: {
        total: 8589934592,
        used: Math.random() * 3000000000 + 1000000000,
        free: 4589934592,
        usage_percent: Math.random() * 40 + 15
      },
      disk: {
        total: 107374182400,
        used: Math.random() * 20000000000 + 5000000000,
        free: 82374182400,
        usage_percent: Math.random() * 20 + 10
      },
      network: [
        {
          name: 'eth0',
          bytes_sent: Math.random() * 50000000 + 50000000,
          bytes_recv: Math.random() * 100000000 + 100000000
        }
      ]
    }
  }

  // 模拟进程数据
  const getMockProcesses = () => {
    const mockProcesses = []
    const processNames = ['systemd', 'nginx', 'mysql', 'redis-server', 'node', 'go', 'python3', 'bash', 'sshd', 'docker']
    
    for (let i = 0; i < 20; i++) {
      mockProcesses.push({
        pid: 1000 + i,
        name: processNames[i % processNames.length],
        cpu_percent: Math.random() * 10,
        mem_percent: Math.random() * 5,
        status: i % 3 === 0 ? 'running' : (i % 3 === 1 ? 'sleeping' : 'stopped')
      })
    }
    
    return mockProcesses
  }

  // 格式化字节数
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    k = 1024
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 进程表格列配置
  const processColumns = [
    {
      title: 'PID',
      dataIndex: 'pid',
      key: 'pid',
      width: 80
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'CPU使用率',
      dataIndex: 'cpu_percent',
      key: 'cpu_percent',
      render: (value) => `${value.toFixed(2)}%`
    },
    {
      title: '内存使用率',
      dataIndex: 'mem_percent',
      key: 'mem_percent',
      render: (value) => `${value.toFixed(2)}%`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default'
        let text = status
        
        switch (status) {
          case 'running':
            color = 'green'
            text = '运行中'
            break
          case 'sleeping':
            color = 'blue'
            text = '睡眠'
            break
          case 'stopped':
            color = 'gray'
            text = '已停止'
            break
          default:
            color = 'default'
        }
        
        return <Tag color={color}>{text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button.Group>
          <Button size="small" icon={<EllipsisOutlined />} />
          <Button size="small" icon={<PauseCircleOutlined />} disabled={record.status !== 'running'} />
          <Button size="small" icon={<CloseOutlined />} danger />
        </Button.Group>
      )
    }
  ]

  // CPU使用率图表配置
  const cpuChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['CPU使用率']
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({length: 24}, (_, i) => `${i}:00`)
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      name: 'CPU使用率',
      data: Array.from({length: 24}, () => Math.random() * 60 + 10),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: 'rgba(24, 144, 255, 0.1)'
      },
      lineStyle: {
        color: '#1890ff',
        width: 2
      }
    }]
  }

  // 内存使用率图表配置
  const memoryChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['已用内存', '可用内存']
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({length: 24}, (_, i) => `${i}:00`)
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        formatter: function(value) {
          return (value / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
        }
      }
    },
    series: [
      {
        name: '已用内存',
        data: Array.from({length: 24}, () => Math.random() * 3000000000 + 1000000000),
        type: 'line',
        smooth: true,
        stack: 'Total',
        areaStyle: {
          color: 'rgba(24, 144, 255, 0.2)'
        },
        lineStyle: {
          color: '#1890ff'
        }
      },
      {
        name: '可用内存',
        data: Array.from({length: 24}, () => Math.random() * 2000000000 + 3000000000),
        type: 'line',
        smooth: true,
        stack: 'Total',
        areaStyle: {
          color: 'rgba(52, 211, 153, 0.2)'
        },
        lineStyle: {
          color: '#34d399'
        }
      }
    ]
  }

  // 处理时间范围变化
  const handleTimeRangeChange = (value) => {
    setTimeRange(value)
    // 这里可以根据不同的时间范围加载不同的数据
  }

  // 手动刷新数据
  const handleRefresh = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div className="system-monitor">
      <div className="page-header">
        <Title level={4}>系统监控</Title>
        <div className="header-actions">
          <Select defaultValue="hour" style={{ width: 120 }} onChange={handleTimeRangeChange}>
            <Option value="hour">最近1小时</Option>
            <Option value="day">最近24小时</Option>
            <Option value="week">最近7天</Option>
            <Option value="month">最近30天</Option>
          </Select>
          <Button type="primary" icon={<SyncOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </div>
      </div>

      {/* 系统概览卡片 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <div className="stat-item">
              <div className="stat-title">CPU使用率</div>
              <div className="stat-value">
                <span className="value">{systemStatus?.cpu?.usage_percent?.toFixed(1) || 0}%</span>
              </div>
              <div className="stat-progress">
                <div 
                  className="progress-bar cpu-bar" 
                  style={{ width: `${Math.min(systemStatus?.cpu?.usage_percent || 0, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <div className="stat-item">
              <div className="stat-title">CPU温度</div>
              <div className="stat-value">
                <span 
                  className="value" 
                  style={{
                    color: (systemStatus?.cpu?.temperature || 0) > 70 ? '#cf1322' : 
                           (systemStatus?.cpu?.temperature || 0) > 50 ? '#fa8c16' : '#3f8600'
                  }}
                >
                  {systemStatus?.cpu?.temperature?.toFixed(1) || 0}°C
                </span>
              </div>
              <div className="stat-progress">
                <div 
                  className="progress-bar temp-bar" 
                  style={{ 
                    width: `${Math.min((systemStatus?.cpu?.temperature || 0), 100)}%`,
                    backgroundColor: (systemStatus?.cpu?.temperature || 0) > 70 ? '#cf1322' : 
                                     (systemStatus?.cpu?.temperature || 0) > 50 ? '#fa8c16' : '#3f8600'
                  }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <div className="stat-item">
              <div className="stat-title">内存使用</div>
              <div className="stat-value">
                <span className="value">{systemStatus?.memory?.usage_percent?.toFixed(1) || 0}%</span>
                <span className="detail">
                  {formatBytes(systemStatus?.memory?.used || 0)} / {formatBytes(systemStatus?.memory?.total || 0)}
                </span>
              </div>
              <div className="stat-progress">
                <div 
                  className="progress-bar memory-bar" 
                  style={{ width: `${Math.min(systemStatus?.memory?.usage_percent || 0, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <div className="stat-item">
              <div className="stat-title">磁盘使用</div>
              <div className="stat-value">
                <span className="value">{systemStatus?.disk?.usage_percent?.toFixed(1) || 0}%</span>
                <span className="detail">
                  {formatBytes(systemStatus?.disk?.used || 0)} / {formatBytes(systemStatus?.disk?.total || 0)}
                </span>
              </div>
              <div className="stat-progress">
                <div 
                  className="progress-bar disk-bar" 
                  style={{ width: `${Math.min(systemStatus?.disk?.usage_percent || 0, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="stat-card">
            <div className="stat-item">
              <div className="stat-title">网络流量</div>
              <div className="stat-value">
                <span className="value">{formatBytes(systemStatus?.network?.[0]?.bytes_recv || 0)}</span>
                <span className="detail">接收</span>
              </div>
              <div className="stat-value">
                <span className="value">{formatBytes(systemStatus?.network?.[0]?.bytes_sent || 0)}</span>
                <span className="detail">发送</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} lg={12}>
          <Card title="CPU使用率趋势" bordered={false} className="chart-card">
            <ReactECharts option={cpuChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="内存使用趋势" bordered={false} className="chart-card">
            <ReactECharts option={memoryChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 进程列表 */}
      <Card title="进程列表" bordered={false} className="process-card">
        <Table
          columns={processColumns}
          dataSource={processes}
          rowKey="pid"
          pagination={{ pageSize: 10 }}
          loading={processLoading}
          scroll={{ x: 768 }}
        />
      </Card>
    </div>
  )
}

export default SystemMonitor