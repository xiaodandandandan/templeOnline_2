# -*- coding: utf-8 -*-
"""下载本轮事务的页面基线 → 保存 .baseline → 用新场景覆盖 → 输出双向 diff 摘要。"""
import io, os, sys, urllib.request, urllib.parse, shutil, difflib

TX_URL = 'https://workbuddy-space-static.codebuddy.work/page/PBrUoiNsIkIddSBM2Fguqi/GX2Nrf_WTnhf/'
NAME = '徑山萬壽禪寺_山門殿_threejs.html'
TMP = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/_tx'
NEW = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-temple/index.html'

os.makedirs(TMP + '/.baseline', exist_ok=True)
url = TX_URL + urllib.parse.quote(NAME)
raw = urllib.request.urlopen(url, timeout=90).read()
io.open(TMP + '/.baseline/' + NAME, 'wb').write(raw)
io.open(TMP + '/' + NAME, 'wb').write(raw)
print('BASELINE', len(raw), 'bytes')

new_raw = io.open(NEW, 'rb').read()
io.open(TMP + '/' + NAME, 'wb').write(new_raw)
print('WORKING ', len(new_raw), 'bytes')

a = raw.decode('utf-8').splitlines(keepends=True)
b = new_raw.decode('utf-8').splitlines(keepends=True)
d = list(difflib.unified_diff(a, b, n=1))
removed = [l[1:].rstrip() for l in d if l.startswith('-') and not l.startswith('---')]
added = [l[1:].rstrip() for l in d if l.startswith('+') and not l.startswith('+++')]
print('DIFF removed lines =', len(removed), ' added lines =', len(added))
print('--- removed (direction A) ---')
for l in removed[:90]:
    print('  -', l[:150])
print('--- added sample (direction B) ---')
for l in added[:12]:
    print('  +', l[:150])
print('  ...')
