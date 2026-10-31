# 数据管理

上游不携带 UO 实际大数据。首个真实样本由 downstream 的 `configs/memorial-quad.json` 指定，并缓存在 downstream 的 `data/raw/`。本仓库 `raw/`、`processed/` 与根目录 `exports/`、`artifacts/` 为本地工作目录，默认忽略。

后续可提交小型合成验证样本、配置、来源台账与校验和；大型 LAZ、GeoTIFF、照片和生成模型不直接放入普通 Git。

每个输入应有具体产品 ID、来源 URL、获取/采集日期、坐标与单位、校验和、使用条件依据及验证状态。通用代码的许可证与输入数据、生成资产的许可证分别记录。当前尚未选定许可证或数据存储服务。
