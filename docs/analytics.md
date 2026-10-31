**English** | [简体中文](zh-CN/analytics.md)

# Repository traffic and website analytics

These are separate measurements. GitHub repository views do not count GitHub Pages visits; application interaction events do not represent additional pageviews.

## Repository archive

GitHub's [Traffic API](https://docs.github.com/en/rest/metrics/traffic) returns roughly 14 days of views/visitors and clones. The reusable `scripts/archive-github-traffic.py` uses an existing local `gh` login and upserts daily values into a private archive, retaining raw UTC snapshots. It never copies authentication tokens or stores them in Actions secrets. A fine-grained token would require Administration read permission; ordinary Actions contents permissions are not sufficient for traffic access.

```powershell
python scripts/archive-github-traffic.py --repo owner/upstream --repo owner/map --output /path/to/private-archive --archive-repository owner/private-archive --publish
```

The collector checks the destination remote, private visibility and clean working tree before pulling. Overlapping windows replace daily values rather than being added twice. Daily unique visitors cannot be summed as global unique visitors. Missing windows are not zero traffic; initial collection cannot recover older data. Recent values can be partial or delayed. Local scheduled collection needs the desktop and `gh` login available; it is not an always-on hosted job.

## Optional web analytics

The explorer defaults to no web analytics. To enable the implemented GoatCounter adapter, supply an account-owned site code in `public/viewer-profile.json`:

```json
{
  "analytics": {
    "enabled": true,
    "provider": "goatcounter",
    "site_code": "YOUR-REGISTERED-SITE-CODE",
    "allowed_hosts": ["your-map.example"]
  }
}
```

Register the code with [GoatCounter](https://www.goatcounter.com/signup) first; a guessed code is not a working analytics endpoint. No account password or private API token belongs in the browser profile. Keep the dashboard private unless its owner deliberately chooses otherwise.

The adapter loads the official asynchronous client only for explicitly allowed hosts with valid enabled configuration. It excludes automated browsers and honors DNT/GPC. A blocked client never prevents the map from loading or responding. It sends a pageview with the pathname only, no query/hash/referrer, plus a fixed allowlist of events: camera view changes, a building-search selection, Settings, return to start and touch walking. Each event type is counted at most once per page load, so event totals indicate pages with that interaction rather than raw clicks or movement frames. Search text, selected building IDs and player coordinates are not sent. The About panel discloses collection when configured.

See GoatCounter's [event API](https://www.goatcounter.com/help/events), [JavaScript configuration](https://www.goatcounter.com/help/js) and [privacy policy](https://www.goatcounter.com/help/privacy). The provider determines visitor/session definitions and performs network-level processing; do not claim these are exact people counts or that a browser request exposes no network metadata. Ad blockers and privacy preferences can reduce recorded counts.

Unit tests cover disabled/local/automation/privacy states, sanitized pageviews, bounded event names, deduplication and client failures. The synthetic and UO browser suites continue with analytics disabled in automation.
