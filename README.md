# In Memory of Justin Jin, 金进捷 - Justin Memorial Website

这是一个纯静态纪念网站重构版本。

## 结构

- `index.html`：主页
- `wishes/`：寄语页
- `gallery/`：相册页
- `videos/`：影像页
- `assets/`：样式、脚本和整理后的图片资源
- `data/`：由脚本生成的静态数据文件
- `scripts/build-content.mjs`：从 `tmp/` 中提取旧 WordPress 内容并重建静态数据

## 重新生成内容

在项目根目录运行：

```bash
node scripts/build-content.mjs
```

脚本会：

- 从 `tmp/寄语.csv` 提取寄语、相册、影像内容
- 复制并重组 `tmp/uploads/` 中需要保留的图片
- 生成 `data/messages.js`、`data/gallery.js`、`data/videos.js`

所有页面均为 UTF-8 编码，可直接部署为静态网站。
