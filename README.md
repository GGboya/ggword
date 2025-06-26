# GGWord - 个人单词本

一个简单而优雅的个人单词记忆工具，使用Go后端 + 现代化前端界面构建。

## 功能特点

### 📚 单词管理
- 添加新单词（英文、中文、音标、例句、难度）
- 编辑已有单词
- 删除单词
- 搜索和过滤功能
- 多种排序方式

### 🧠 练习模式
- 英译中练习
- 中译英练习
- 混合模式练习
- 支持键盘快捷键操作
- 复习次数统计

### 📊 统计信息
- 总单词数统计
- 总复习次数统计
- 平均难度分析
- 熟练单词统计
- 难度分布图表

### ✨ 界面特色
- 现代化渐变背景设计
- 响应式布局，支持移动端
- 流畅的动画效果
- 直观的用户体验
- 暗色模式友好

## 技术栈

- **后端**: Go 1.21+
- **路由**: gorilla/mux
- **CORS**: rs/cors
- **数据存储**: JSON文件
- **前端**: 纯HTML/CSS/JavaScript
- **图标**: Font Awesome 6
- **样式**: 自定义CSS（渐变、动画、响应式）

## 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd ggword
```

### 2. 安装Go依赖
```bash
go mod tidy
```

### 3. 运行项目
```bash
go run main.go
```

### 4. 访问应用
打开浏览器访问: http://localhost:8080

## 项目结构

```
ggword/
├── main.go              # Go后端主文件
├── go.mod              # Go模块定义
├── words.json          # 单词数据文件（运行时自动生成）
├── static/             # 静态文件目录
│   ├── index.html      # 主页面
│   ├── css/
│   │   └── style.css   # 样式文件
│   └── js/
│       └── app.js      # JavaScript功能
└── README.md           # 项目说明
```

## API接口

### 获取所有单词
```
GET /api/words
```

### 添加新单词
```
POST /api/words
Content-Type: application/json

{
  "english": "hello",
  "chinese": "你好",
  "pronunciation": "/həˈloʊ/",
  "example": "Hello, world!",
  "difficulty": 1
}
```

### 更新单词
```
PUT /api/words/{id}
Content-Type: application/json

{
  "english": "hello",
  "chinese": "你好",
  "pronunciation": "/həˈloʊ/",
  "example": "Hello, world!",
  "difficulty": 1
}
```

### 删除单词
```
DELETE /api/words/{id}
```

### 复习单词（增加复习次数）
```
POST /api/words/{id}/review
```

## 使用说明

### 添加单词
1. 点击"添加单词"标签页
2. 填写英文单词（必填）和中文意思（必填）
3. 可选填写音标、例句和设置难度等级
4. 点击"添加单词"按钮

### 管理单词
- **搜索**: 在搜索框中输入英文或中文进行搜索
- **过滤**: 按难度等级过滤单词
- **排序**: 支持按创建时间、英文字母、难度、复习次数排序
- **编辑**: 点击单词卡片上的编辑图标
- **删除**: 点击删除图标并确认
- **复习**: 点击复习图标增加复习次数

### 练习模式
1. 点击"练习模式"标签页
2. 选择练习类型（英译中/中译英/混合模式）
3. 点击"开始练习"
4. 使用键盘快捷键提高效率：
   - `空格键` 或 `回车`: 显示答案/下一个单词
   - `1`: 标记为认识
   - `2`: 标记为不认识
   - `ESC`: 关闭模态框

### 查看统计
点击"统计信息"标签页查看学习进度和单词分布情况。

## 数据存储

- 所有单词数据存储在`words.json`文件中
- 首次运行会自动创建示例数据
- 数据实时保存，无需手动备份
- 支持手动编辑JSON文件进行批量导入

## 自定义配置

### 修改端口
在`main.go`文件中修改端口号：
```go
log.Fatal(http.ListenAndServe(":8080", handler))
```

### 修改数据文件路径
在`main.go`文件中修改文件名：
```go
wordManager := NewWordManager("words.json")
```

## 浏览器支持

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

享受学习单词的乐趣吧！ 📖✨ 