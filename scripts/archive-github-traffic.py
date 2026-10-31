# SPDX-License-Identifier: Apache-2.0
"""Archive GitHub's rolling traffic windows using the existing gh login.

No token is exported, copied into Actions, or written to disk by this script.
Daily visitors are not additive across days. Counts may be revised by GitHub.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess


def command(*args, cwd=None):
    return subprocess.check_output(args, cwd=cwd, text=True, encoding='utf-8').strip()


def merge_days(existing, views, clones):
    rows={row['date']:dict(row) for row in existing}
    for kind,payload in [('views',views),('clones',clones)]:
        for point in payload[kind]:
            date=point['timestamp'][:10]
            rows.setdefault(date,{'date':date})[kind]=point['count']
            rows[date][kind+'_daily_uniques']=point['uniques']
    return [rows[date] for date in sorted(rows)]


def archive(repositories, output, archive_repository, publish=False):
    output=Path(output).resolve()
    for name in [archive_repository,*repositories]:
        if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',name):
            raise ValueError('Invalid repository name')
    remote=command('git','remote','get-url','origin',cwd=output)
    if remote.removesuffix('.git') not in [f'https://github.com/{archive_repository}',f'git@github.com:{archive_repository}']:
        raise ValueError('Archive origin does not match the requested repository')
    visibility=json.loads(command('gh','repo','view',archive_repository,'--json','isPrivate'))
    if not visibility['isPrivate']:
        raise ValueError('Traffic archive must be private')
    if command('git','status','--porcelain',cwd=output):
        raise ValueError('Archive has local changes; preserve/review them before collecting')
    command('git','pull','--ff-only',cwd=output)
    now=datetime.now(timezone.utc);stamp=now.strftime('%Y%m%dT%H%M%SZ')
    # Fetch all sources before mutating the archive.
    fetched={repo:{kind:json.loads(command('gh','api',f'repos/{repo}/traffic/{kind}?per=day'))
                   for kind in ['views','clones']} for repo in repositories}
    summary=['# OpenCampus traffic archive','','Private aggregate records. Source: GitHub Traffic API; captured in UTC.','',
             'Repository traffic and GitHub Pages website usage are separate. This archive covers repository traffic only.','',
             '| Repository | API rolling-window views | API window visitors | Window clones | Captured |',
             '| --- | ---: | ---: | ---: | --- |']
    def write(path,value):
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
    for repo,payload in fetched.items():
        slug=repo.replace('/','__');folder=output/'data'/slug
        history=folder/'daily.json'
        old=json.loads(history.read_text(encoding='utf-8'))['days'] if history.exists() else []
        write(history,{'version':1,'repository':repo,'updated_at':now.isoformat(),
                       'note':'Upsert daily values; never sum overlapping API windows or daily visitors as global unique users.',
                       'days':merge_days(old,payload['views'],payload['clones'])})
        write(folder/'latest.json',{'captured_at':now.isoformat(),**payload})
        write(folder/'snapshots'/f'{stamp}.json',{'captured_at':now.isoformat(),**payload})
        summary.append(f"| [{repo}](https://github.com/{repo}/graphs/traffic) | {payload['views']['count']} | {payload['views']['uniques']} | {payload['clones']['count']} | {now.isoformat()} |")
    summary+=['','The API provides about 14 days. Initial collection cannot recover earlier history. Recent dates may be partial or delayed; subsequent runs replace overlapping daily values. Missing collection windows must not be presented as zero visits. Daily visitor totals cannot be deduplicated across days.','',
              'Collection uses local gh authentication and a daily Codex desktop automation. The desktop must be available and logged in; this is not an always-on cloud collector. Run again within 14 days to avoid a gap.','',
              '## 中文说明','','本私有仓库归档上下游 GitHub 仓库访问／访客和克隆统计，网页访问与交互另行统计。按 UTC 每日值更新，不重复累加重叠窗口，不把每日访客之和当作全局独立访客。首次无法恢复更早历史，近期数字可能延迟或仍不完整。每日采集依赖本机 Codex 和 gh 登录可用，连续超过 14 天未运行可能出现不可恢复的缺口。','']
    (output/'README.md').write_text('\n'.join(summary),encoding='utf-8')
    if publish:
        command('git','add','data','README.md',cwd=output)
        command('git','commit','-m',f'Archive repository traffic {stamp}',cwd=output)
        command('git','push','origin','HEAD',cwd=output)
    return {'captured_at':now.isoformat(),'repositories':repositories,'published':publish}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',action='append',required=True)
    parser.add_argument('--output',required=True)
    parser.add_argument('--archive-repository',required=True)
    parser.add_argument('--publish',action='store_true')
    args=parser.parse_args()
    print(json.dumps(archive(args.repo,args.output,args.archive_repository,args.publish),indent=2))
