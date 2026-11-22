#!/usr/bin/env python3
"""공개 프록시로 각 원본을 1건씩 호출하여 접근 가능 여부를 기록한다."""
import json
import os
from pathlib import Path
import subprocess
from datetime import datetime, timezone
from urllib.parse import urlencode

base = os.environ.get('API_BASE_URL', 'http://localhost:8080').rstrip('/')

def fetch(path):
    result = subprocess.run(['curl', '-fsS', '--max-time', '35', base + path], capture_output=True, check=True)
    return json.loads(result.stdout)

results = []
for dataset in fetch('/api/v1/datasets'):
    definition = dataset['definition']
    params = {'page': 1, 'size': 1}
    if definition['id'] in ('reb_table_items', 'reb_real_estate_statistics'):
        params['STATBL_ID'] = 'A_2024_00900'
    if definition['id'] == 'reb_real_estate_statistics':
        params.update(DTACYCLE_CD='YY', WRTTIME_IDTFR_ID='2025')
    page = fetch('/api/v1/proxy/' + definition['id'] + '?' + urlencode(params))
    assert page['source'] == 'upstream'
    assert page['items'], definition['id'] + ': empty sample'
    results.append({'dataset': definition['id'], 'status': 'OK', 'parameters': params,
                    'total': page['total'], 'fields': list(page['items'][0])})
    print(definition['id'] + ': OK')

output = Path('docs/proxy-verification.json')
output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps({'verifiedAt': datetime.now(timezone.utc).isoformat(), 'baseUrl': base,
                             'note': '원본별 1건 호출 결과이며 전체 수집 완료를 의미하지 않습니다.',
                             'datasets': results}, ensure_ascii=False, indent=2) + '\n')
