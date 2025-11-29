import React from 'react';
import { Card, Row, Col, Statistic, Progress, List, Avatar } from 'antd';
import { 
  PictureOutlined, 
  CloudUploadOutlined, 
  ToolOutlined,
  TagsOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { imagesAPI } from '../../api/images';

function HomePage() {
  // 获取统计数据
  const { data: imagesData } = useQuery(
    ['images', 1, 10],
    () => imagesAPI.getImages({ page: 1, limit: 10 }),
    {
      refetchInterval: 30000, // 30秒刷新一次
    }
  );

  const totalImages = imagesData?.pagination?.total || 0;
  const recentImages = imagesData?.images?.slice(0, 5) || [];

  const statsData = [
    {
      title: '总图片数',
      value: totalImages,
      icon: <PictureOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: '今日上传',
      value: 0,
      icon: <CloudUploadOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: '处理任务',
      value: 0,
      icon: <ToolOutlined style={{ color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: '标签数量',
      value: 0,
      icon: <TagsOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1'
    }
  ];

  const quickActions = [
    {
      title: '上传图片',
      description: '批量上传产品图片',
      icon: <CloudUploadOutlined />,
      color: '#1890ff',
      path: '/images'
    },
    {
      title: '图片处理',
      description: '批量处理图片背景、尺寸等',
      icon: <ToolOutlined />,
      color: '#52c41a',
      path: '/processing'
    },
    {
      title: '图片爬取',
      description: '从各大平台爬取产品图片',
      icon: <PictureOutlined />,
      color: '#faad14',
      path: '/crawler'
    },
    {
      title: '标签管理',
      description: '管理图片标签和分类',
      icon: <TagsOutlined />,
      color: '#722ed1',
      path: '/tags'
    }
  ];

  return (
    <div className="dashboard-page">
      <h1 className="page-title">仪表盘</h1>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsData.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 快捷操作 */}
        <Col xs={24} lg={12}>
          <Card title="快捷操作" extra={<TrophyOutlined />}>
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={12} key={index}>
                  <Card 
                    size="small" 
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => window.location.href = action.path}
                  >
                    <div style={{ fontSize: 24, color: action.color, marginBottom: 8 }}>
                      {action.icon}
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {action.description}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 最近上传 */}
        <Col xs={24} lg={12}>
          <Card title="最近上传" extra={<ClockCircleOutlined />}>
            {recentImages.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={recentImages}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          shape="square" 
                          size={48}
                          src={`http://localhost:3000${item.url}`}
                          icon={<PictureOutlined />}
                        />
                      }
                      title={item.filename}
                      description={
                        <div>
                          <div>{(item.size / 1024).toFixed(1)} KB</div>
                          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                暂无图片，<a href="/images">立即上传</a>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 系统状态 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="存储使用情况">
            <Progress 
              percent={30} 
              status="active"
              format={() => '30% (3GB/10GB)'}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="处理队列">
            <Progress 
              percent={0} 
              format={() => '0 个任务'}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="系统状态">
            <div style={{ color: '#52c41a', fontSize: 16 }}>
              ● 运行正常
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              上次检查: {new Date().toLocaleTimeString()}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default HomePage;