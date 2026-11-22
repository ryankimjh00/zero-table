#!/usr/bin/env python3
"""배포된 공개 API의 기본 동작을 검증한다. API 키는 사용하지 않는다."""
import json
import os
import subprocess

base = os.environ.get('API_BASE_URL', 'http://localhost:8080').rstrip('/')

def fetch(path):
    result = subprocess.run(['curl', '-fsS', '--max-time', '40', base + path], capture_output=True, check=True)
    return json.loads(result.stdout)

assert fetch('/actuator/health')['status'] == 'UP'
datasets = fetch('/api/v1/datasets')
assert len(datasets) == 9
assert '/api/v1/proxy/{dataset}' in fetch('/v3/api-docs')['paths']
for dataset in datasets:
    definition = dataset['definition']
    page = fetch('/api/v1/datasets/' + definition['id'] + '/records?size=1')
    assert page['source'] == 'sqlite'
    assert 'api_key' not in json.dumps(dataset).lower()
    print(definition['id'] + ': ' + str(page['total']) + ' records')
print('공개 API health/카탈로그/SQLite 조회/Swagger 검증 완료')
