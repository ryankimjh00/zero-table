# ZERO TABLE 프론트엔드

React 19 · Vite · react-router. 백엔드 API는 `https://webframework.monithub.org`를 사용합니다.
API 명세는 [backend/docs/SCORING.md](../backend/docs/SCORING.md), [FRONTEND.md](../backend/docs/FRONTEND.md)를 기준으로 합니다.

## 1. 처음 준비

| 프로그램 | 확인 |
|---|---|
| Git | `git --version` |
| Node 20 이상 | `node --version` |

```bash
cd frontend
npm ci          # 라이브러리 설치. 처음 한 번, 또는 package-lock.json이 바뀌었을 때
npm run dev     # 개발 서버 http://localhost:5173 (저장하면 바로 반영)
```

## 2. 이슈 진행 순서

1. **이슈 확인**: 내 담당인지, "기다리는 것"이 끝났는지 본다.
2. **최신 main에서 브랜치 만들기**
   ```bash
   git switch main
   git pull
   git switch -c feat/report-price-notice
   ```
   이름은 `종류/영어-설명`.
3. **수정**: 이슈 "할 일"의 파일만. "고치지 않는 곳"과 `backend/`는 건드리지 않는다.
4. **확인**: `npm run lint`, `npm run build` 통과 + 이슈 "확인 방법"대로 브라우저 확인.
5. **커밋**
   ```bash
   git add 고친-파일-경로          # git add . 은 쓰지 않는다
   git diff --cached               # 올라갈 내용 확인
   git commit -m "feat: 보고서 가격 비교를 안내 문구로 교체"
   git push -u origin feat/report-price-notice
   ```
6. **PR**: main으로. 아래 PR 양식대로.
7. **머지** (팀 확인 필요): frontend/만 바꾼 PR은 올린 사람이 "Create a merge commit"으로 머지.
8. **다음 이슈**: 같은 파일을 고치는 이슈는 앞 PR이 머지된 뒤 2번부터.

### 혼자 정해도 되는 것 / 단톡에 올릴 것

- **혼자 정함**: 컴포넌트 나누기, 변수·함수 이름, 내부 구현 → PR "작업자가 정한 것"에 적기
- **단톡에 올림**: API 요청·응답 형식, 점수 계산 규칙, 화면에 보이는 안내 문장, 다른 사람 담당 파일 수정

## 3. 규칙

| 종류 | 언제 |
|---|---|
| `feat` | 기능 추가·변경 |
| `fix` | 버그 수정 |
| `refactor` | 동작은 그대로, 구조만 변경 |
| `chore` | 정리·설정 |
| `docs` | 문서 |

- 커밋 메시지: `종류: 한국어 내용`. 커밋 하나에 변경 하나.
- `.env`, 데이터 파일(csv, xlsx), API 키는 커밋하지 않는다. 실수로 올렸으면 바로 단톡에.

### 같이 쓰는 파일

| 파일 | 규칙 |
|---|---|
| 다른 사람 담당 파일 | 고치기 전에 단톡에 알린다 |
| `index.css` | 새 스타일은 `/* ---------- 구역 이름 ---------- */` 아래에 모아 추가. 다른 구역은 고치지 않는다 |
| `package.json` | 패키지 추가는 단톡에 알린다 (팀원도 `npm ci` 필요) |
| `api.js`, `format.js` | 함수 추가는 괜찮음. 기존 함수의 동작을 바꾸면 단톡에 알린다 |

## 4. PR 양식

```markdown
Closes #이슈번호

## 변경 사항
-

## 작업자가 정한 것과 이유
- (이슈에 없던 걸 정했다면. 없으면 "없음")

## 검증
- npm run lint, npm run build:
- 브라우저 확인:

## 남은 문제
- (없으면 "없음")
```

## 5. 막혔을 때

30분 넘게 안 풀리면 단톡에 올린다.

```
[막힘] #이슈번호 이슈 이름
- 오류: (오류 메시지 그대로, 또는 기대한 것과 실제)
- 해 본 것:
- 지금 상태: (브랜치, 어디까지 됐는지)
```
