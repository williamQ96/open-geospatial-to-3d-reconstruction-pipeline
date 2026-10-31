[English](../analytics.md) | **简体中文**

# 仓库流量与网页统计

GitHub 仓库访问、GitHub Pages 网页访问、网页交互事件是不同指标，分别记录。交互事件不能当作额外页面访问。

`scripts/archive-github-traffic.py` 使用已有本机 `gh` 登录，将 [GitHub Traffic API](https://docs.github.com/en/rest/metrics/traffic) 最近约 14 天的访问／访客与克隆数据更新到私有统计仓库，保留 UTC 原始快照。不复制令牌，不写入 Actions secrets。细粒度令牌须 Administration read，普通 Actions contents 权限不足以读取流量。

重复窗口按日期替换，不重复累加；每日独立访客不能累加为全局独立访客。初次无法恢复更早记录，近期值可能延迟或尚未完整，漏采不能写成零。本机自动任务要求桌面与登录可用，不是全天候云采集。运行参数见[英文说明](../analytics.md)。

浏览器模板默认关闭统计。启用 GoatCounter 时，在 `public/viewer-profile.json` 中提供 `analytics.enabled: true`、`provider: goatcounter`、已注册的 `site_code` 和生产域名 `allowed_hosts`。先在 [GoatCounter](https://www.goatcounter.com/signup) 创建站点，不能猜一个 code 就宣称开始统计。前端不能放账户密码或私有 API token；默认保持后台私有。

仅在生产域名加载异步官方客户端，跳过自动化浏览器并尊重 DNT／GPC；统计服务被阻止不影响地图。页面访问只发送 pathname，不发送 query／hash／referrer；交互仅包含固定事件名：视角切换、搜索选择、设置、重置和触摸行走。同一种事件每次页面加载最多记一次，表示发生过这种交互的页面次数，不代表原始点击／移动帧数。不上传搜索词、建筑 ID 或人物坐标，配置启用后在 About 披露。

访客／会话定义与网络层处理取决于服务商，不能当作精确人数，也不能声称网络请求没有网络元数据。参见 [GoatCounter 隐私说明](https://www.goatcounter.com/help/privacy)。广告拦截与隐私偏好可能减少记录数量。

单元测试覆盖关闭、本地、自动浏览器、隐私偏好、清理后的数据、事件白名单／去重和加载失败；浏览器自动测试不发送真实统计。
