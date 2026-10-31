[English](README.md) | **简体中文**

# 地理三维浏览器模板

运行 `npm ci`、`npm run dev` 即可使用附带的合成场景。包含 Follow、First person、Overview，移动碰撞、跳跃、滚轮缩放、名称／缩写搜索、45° 近景、标签、小地图和设置。

修改 `public/viewer-profile.json` 配置品牌、说明、来源、仓库与署名；场景放在 `public/scene/`，出生朝向可放在 `viewer-settings.json`。合成示例不对应真实地理位置，也不携带 UO 数据、logo、部署身份或凭据。

上游 Python 命令 `init-viewer --output ../new-map --scene-dir <导出目录>` 可创建自己的地图项目；`sync-viewer` 按文件 hash 安全升级共享代码，保留具体项目资料。

`npm test`、`npm run build`、`npm run test:browser` 负责检查；`npm run demo` 重建小型合成示例。代码采用 Apache-2.0，原创内容采用 CC BY 4.0；保留 NOTICE、署名和第三方字体／依赖条款。
