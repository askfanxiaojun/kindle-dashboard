# Kindle Dashboard

一个不需要越狱或刷机、直接通过 Kindle 内置浏览器使用的电子墨水信息屏。页面显示当前天气、未来四日预报、日期和月历，并每 15 分钟自动刷新。

在线地址：<https://askfanxiaojun.github.io/kindle-dashboard/>

## 使用方式

部署后，在 Kindle 的 Experimental Browser 中打开 Pages 地址并加入书签。页面会通过公网 IP 自动判断城市和经纬度，并把定位结果在当前 Kindle 中缓存 7 天。

定位优先级为：URL 手动参数 → 7 天定位缓存 → IP 自动定位 → 新加坡默认位置。

如果 IP 定位不准确，可以通过 URL 参数固定显示名称和坐标：

```text
https://askfanxiaojun.github.io/kindle-dashboard/?city=上海&lat=31.2304&lon=121.4737
```

支持的参数：

| 参数 | 含义 | 默认值 |
|---|---|---|
| `city` | 页面顶部显示的地区名称 | 自动判断 |
| `lat` | 纬度，与 `lon` 一起使用 | 自动判断 |
| `lon` | 经度，与 `lat` 一起使用 | 自动判断 |

## 设计原则

- 纯静态 HTML、CSS 和 ES5 JavaScript，不依赖框架或外部字体。
- 使用 [GeoJS](https://www.geojs.io/) 进行免密钥 IP 自动定位，失败时尝试 ipwho.is，并缓存 7 天以减少请求。
- 使用 `XMLHttpRequest` 请求 [Open-Meteo](https://open-meteo.com/) 的免密钥天气接口。
- 请求失败时显示浏览器中最后一次成功缓存的天气，不影响日期和月历。
- 所有资源使用相对路径，兼容 GitHub Pages 项目子路径。
- 页面通过 HTML `meta refresh` 每 900 秒整页刷新。
- 不包含 API Key、私人日历或其他凭据。

## 本地预览

```bash
python3 -m http.server 4174 --directory docs
```

然后访问 `http://127.0.0.1:4174/`。

## Kindle 提示

Kindle 是否能够长期保持浏览器常亮取决于机型和固件。建议先连续运行 24–72 小时，验证自动刷新、休眠、Wi-Fi 和浏览器稳定性。持续联网会明显增加耗电，长期展示时建议连接电源。

## 数据与隐私

自动定位时，GeoJS 或备用定位服务会接收到设备的公网 IP，并返回城市和近似经纬度；页面再把经纬度发送给 Open-Meteo 获取天气。IP 定位不是 GPS，使用 VPN、代理或手机热点时可能显示网络出口城市。

GitHub Pages 是公开网站，不要把私人日历链接、访问令牌或其他密钥写入仓库或 URL。
