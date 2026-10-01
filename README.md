# AKI CLUB WEBSITE · 建站需求收集工具

白色为主、蓝 / 绿 / 橙 / 粉点缀的俱乐部建站需求工作台。六步整理基础资料、品牌方向、菜单内容、功能、客服部署及参考素材。

支持自动保存与恢复、实时摘要、必填和网址校验、需求预览与复制、TXT / PNG 导出、JSON 草稿备份与恢复、品牌及四组选项自定义。保留旧版 `aki_club_brief_*_v1` 草稿格式。

## 本地运行

无运行时依赖，无构建步骤：

```sh
python -m http.server 4178
```

打开 `http://localhost:4178/`。也可直接打开 `index.html`，但建议 HTTP / HTTPS 访问，以保持可靠的浏览器存储与复制行为。

## 数据与分享

数据仅保存在当前浏览器的 localStorage，网站不会自动提交或发送给客服。清除浏览器数据、换设备或换域名都可能失去本机草稿；请使用「导出草稿」保存 JSON 备份，再在目标浏览器导入。导出的文件可能包含客服账号等资料，请自行保管。

PNG 长图宽 1080 px，按内容实际高度排版。超过 14000 px 时提示改用文字导出，避免手机浏览器裁切图片。微信内显示真实图片供长按保存。

模板设置仅影响自己的浏览器。恢复模板保留文字资料，但会取消已移除选项的勾选；导入备份会在确认后覆盖当前项目与模板。

## 验证

安装 Playwright 及 Chromium 后，在运行本地 HTTP 服务时执行：

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser-check.cjs
```

可通过 `TEST_URL` 指定测试网站，`ARTIFACT_DIR` 指定测试下载与截图目录。测试使用独立浏览器环境，不修改真实用户草稿。

## GitHub Pages

发布整个目录到仓库 `main` 分支，在仓库 Settings → Pages 选择 Deploy from a branch → `main` → `/ (root)`。所有资源使用相对路径，可部署到 GitHub Pages 项目子路径，无外部 CDN 或字体依赖。

功能选项用于记录建站需求。勾选后台、付款或数据统计不表示这个需求工具提供对应业务系统。
