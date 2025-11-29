# 产品图片管理系统API文档

## 1. 基础信息

### 1.1 基本URL
`https://api.example.com/v1`

### 1.2 认证方式
所有API请求（除登录/注册外）都需要在请求头中包含有效的JWT令牌：
```
Authorization: Bearer {token}
```

### 1.3 响应格式
所有响应都包含以下字段：
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 1.4 错误码
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 2. 认证API

### 2.1 用户登录
**POST** `/auth/login`

请求参数：
```json
{
  "username": "string",
  "password": "string"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "string",
    "user": {
      "id": "number",
      "username": "string",
      "email": "string",
      "role": "string"
    }
  }
}
```

### 2.2 用户注册
**POST** `/auth/register`

请求参数：
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

## 3. 图片管理API

### 3.1 上传图片
**POST** `/images/upload`

请求头：
```
Content-Type: multipart/form-data
```

请求参数：
- `file`: 图片文件
- `title`: 图片标题（可选）
- `description`: 图片描述（可选）

成功响应：
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": "number",
    "title": "string",
    "url": "string",
    "size": "number",
    "width": "number",
    "height": "number"
  }
}
```

### 3.2 获取图片列表
**GET** `/images`

查询参数：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `tags`: 标签ID，多个用逗号分隔
- `sort`: 排序字段（created_at, size等）
- `order`: 排序方式（asc, desc）

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": "number",
        "title": "string",
        "url": "string",
        "thumbnailUrl": "string",
        "size": "number",
        "width": "number",
        "height": "number",
        "tags": [
          {
            "id": "number",
            "name": "string"
          }
        ],
        "createdAt": "string"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

### 3.3 获取单张图片详情
**GET** `/images/{id}`

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "number",
    "title": "string",
    "description": "string",
    "url": "string",
    "originalUrl": "string",
    "size": "number",
    "width": "number",
    "height": "number",
    "hasWhiteBackground": "boolean",
    "isProcessed": "boolean",
    "source": "string",
    "sourceUrl": "string",
    "tags": [
      {
        "id": "number",
        "name": "string",
        "category": {
          "id": "number",
          "name": "string"
        }
      }
    ],
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 3.4 删除图片
**DELETE** `/images/{id}`

成功响应：
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

## 4. 图片处理API

### 4.1 创建处理任务
**POST** `/processing/tasks`

请求参数：
```json
{
  "imageId": "number",
  "type": "string", // background_removal, resize, border_adjustment, text_removal
  "parameters": {
    // 根据不同类型有不同的参数
  }
}
```

成功响应：
```json
{
  "code": 200,
  "message": "任务创建成功",
  "data": {
    "id": "number",
    "status": "string",
    "createdAt": "string"
  }
}
```

### 4.2 批量处理
**POST** `/processing/batch`

请求参数：
```json
{
  "imageIds": ["number"],
  "tasks": [
    {
      "type": "string",
      "parameters": {}
    }
  ]
}
```

成功响应：
```json
{
  "code": 200,
  "message": "批量任务创建成功",
  "data": {
    "batchId": "number",
    "total": "number",
    "pending": "number",
    "createdAt": "string"
  }
}
```

### 4.3 获取处理任务状态
**GET** `/processing/tasks/{id}`

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "number",
    "imageId": "number",
    "type": "string",
    "status": "string",
    "resultUrl": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "completedAt": "string"
  }
}
```

## 5. 爬虫API

### 5.1 创建爬虫任务
**POST** `/crawler/tasks`

请求参数：
```json
{
  "source": "string", // google, amazon, bing, 1688
  "keywords": "string",
  "maxImages": "number",
  "filters": {
    // 根据不同的来源有不同的过滤条件
  }
}
```

成功响应：
```json
{
  "code": 200,
  "message": "爬虫任务创建成功",
  "data": {
    "id": "number",
    "status": "string",
    "createdAt": "string"
  }
}
```

### 5.2 获取爬虫任务状态
**GET** `/crawler/tasks/{id}`

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "number",
    "source": "string",
    "keywords": "string",
    "status": "string",
    "totalFound": "number",
    "totalDownloaded": "number",
    "images": [
      {
        "id": "number",
        "url": "string",
        "thumbnailUrl": "string"
      }
    ],
    "createdAt": "string",
    "updatedAt": "string",
    "completedAt": "string"
  }
}
```

## 6. 标签管理API

### 6.1 获取标签列表
**GET** `/tags`

查询参数：
- `categoryId`: 按分类筛选
- `search`: 搜索关键词

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "number",
      "name": "string",
      "category": {
        "id": "number",
        "name": "string"
      },
      "imageCount": "number"
    }
  ]
}
```

### 6.2 创建标签
**POST** `/tags`

请求参数：
```json
{
  "name": "string",
  "categoryId": "number"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "标签创建成功",
  "data": {
    "id": "number",
    "name": "string",
    "category": {
      "id": "number",
      "name": "string"
    }
  }
}
```

### 6.3 为图片添加标签
**POST** `/images/{imageId}/tags`

请求参数：
```json
{
  "tagIds": ["number"]
}
```

成功响应：
```json
{
  "code": 200,
  "message": "标签添加成功",
  "data": null
}
```

### 6.4 获取标签分类
**GET** `/tag-categories`

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "number",
      "name": "string",
      "description": "string",
      "tagCount": "number"
    }
  ]
}
```

## 7. AI相关API

### 7.1 AI图片生成
**POST** `/ai/generate`

请求参数：
```json
{
  "prompt": "string",
  "parameters": {
    "style": "string",
    "size": "string",
    "count": "number"
  }
}
```

成功响应：
```json
{
  "code": 200,
  "message": "生成任务创建成功",
  "data": {
    "taskId": "number",
    "status": "string"
  }
}
```

### 7.2 AI标签推荐
**POST** `/ai/recommend-tags`

请求参数：
```json
{
  "imageId": "number",
  "count": "number"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "tagId": "number",
      "name": "string",
      "confidence": "number"
    }
  ]
}
```

## 8. 用户管理API

### 8.1 获取当前用户信息
**GET** `/users/me`

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 8.2 更新用户信息
**PUT** `/users/me`

请求参数：
```json
{
  "username": "string",
  "email": "string"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

### 8.3 修改密码
**PUT** `/users/me/password`

请求参数：
```json
{
  "oldPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "密码修改成功",
  "data": null
}
```

## 9. 系统设置API

### 9.1 获取系统设置
**GET** `/settings`

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "key": "string",
      "value": "string",
      "description": "string"
    }
  ]
}
```

### 9.2 更新系统设置
**PUT** `/settings/{key}`

请求参数：
```json
{
  "value": "string"
}
```

成功响应：
```json
{
  "code": 200,
  "message": "设置更新成功",
  "data": {
    "key": "string",
    "value": "string"
  }
}