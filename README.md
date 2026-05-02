# In Memory of Justin Jin, 金进捷

## Justin's Memorial Website

这是一个 Justin 纪念网站在 2026 年的重构版本。

这个项目是纯静态站点，所以可以直接用 GitHub Pages 托管，不需要构建步骤。

---

### 方式一：作为用户主页仓库发布

如果你希望网址就是：

`https://justinjmemorial.github.io/`

那么 GitHub 仓库名必须是：

`justinjmemorial.github.io`

操作步骤：

1. 在 GitHub 新建一个公开仓库，名称设为 `justinjmemorial.github.io`
2. 把当前项目的所有文件上传到该仓库根目录
3. 确认仓库根目录里直接包含 `index.html`、`assets/`、`wishes/`、`gallery/`、`videos/`
4. 打开 GitHub 仓库的 `Settings` -> `Pages`
5. 在 `Build and deployment` 中选择：
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
6. 保存后等待 GitHub Pages 部署完成
7. 部署成功后，网站地址就是 `https://justinjmemorial.github.io/`

### 方式二：作为普通项目仓库发布

如果仓库名称不是 `justinjmemorial.github.io`，例如仓库叫 `justinj`，那么最终地址会变成：

`https://justinjmemorial.github.io/justinj/`

这种情况下通常需要把站内链接改成带项目子路径的版本，当前项目并不是按这个子路径模式写的，所以不推荐。

### 发布前检查

- `index.html` 位于仓库根目录
- `assets/`、`wishes/`、`gallery/`、`videos/`、`data/` 都已一并上传
- 文件编码保持 UTF-8
- 站内资源路径不要改成本地绝对路径

### 更新网站

以后只要把修改后的文件再次提交并推送到 `main` 分支，GitHub Pages 就会自动重新部署。
