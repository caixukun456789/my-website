# 懂你 Link Dock

公网地址：

`https://caixukun456789.github.io/my-website/`

这是一个原生感链接管理 / 书签管理工具的静态网站版本。

## 已实现功能

- 搜索功能
- 收藏夹功能
- 卡片视图 / 列表视图
- 移动到分组
- 分组快捷键：1-6 切换分组，F 打开收藏夹
- 菜单栏快速添加链接：右上角 + 或 Ctrl/⌘ + K
- 支持 URL Scheme：mailto、tel、obsidian、notion、vscode 等
- 添加链接时可以编辑标题
- 自定义链接卡片背景颜色
- 网页预览截图风格展示
- 分组悬停显示该分组的链接图标
- 本地用户账号注册功能

## 安全说明

当前版本是静态前端演示版：

- 账号保存在当前浏览器 localStorage。
- 链接也保存在当前浏览器 localStorage。
- 不会上传到服务器。
- 别人打开公网网站，看不到你本机浏览器保存的数据。
- 不要使用常用密码。

如果要做成真正产品，需要后续增加后端、数据库、登录鉴权、云同步和真实网页截图服务。

## 电脑软件版本

现在项目也支持打包成 Windows 桌面软件。

本地运行：

```powershell
npm install
npm run desktop
```

生成可双击运行的 Windows 版本：

```powershell
npm run dist
```

生成后的文件会放在 `release` 目录。
