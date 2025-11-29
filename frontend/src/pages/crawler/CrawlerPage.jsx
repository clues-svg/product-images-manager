import React, { useState } from 'react';
import { Card, Input, Button, List, Image, message, Spin } from 'antd';
import { SearchOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { crawlImages } from '../../api/crawler';
import './CrawlerPage.less';

function CrawlerPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      message.warning('请输入关键词');
      return;
    }

    setLoading(true);
    try {
      const response = await crawlImages({ 
        source: 'google', 
        keyword: keyword,
        limit: 20 
      });
      
      if (response.success) {
        setImages(response.data);
        message.success(`成功找到 ${response.count} 张图片`);
      } else {
        message.error('爬取失败: ' + response.message);
      }
    } catch (error) {
      console.error(error);
      message.error('爬取请求出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crawler-page">
      <h1 className="page-title">图片爬取</h1>
      <Card className="search-card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <Input 
            size="large"
            placeholder="输入关键词 (例如: iPhone 15 case)" 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<CloudDownloadOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            开始爬取
          </Button>
        </div>
      </Card>

      {images.length > 0 && (
        <Card style={{ marginTop: '20px' }}>
          <List
            grid={{ gutter: 16, column: 4 }}
            dataSource={images}
            renderItem={item => (
              <List.Item>
                <Card 
                  hoverable
                  cover={
                    <Image
                      alt={item.filename}
                      src={`/${item.path}`}
                      fallback="https://via.placeholder.com/200?text=Error"
                    />
                  }
                >
                  <Card.Meta title={item.filename} description={item.source} />
                </Card>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

export default CrawlerPage;