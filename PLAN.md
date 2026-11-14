# PLAN — 원시인 횡스크롤 플랫포머 (가칭 "Grok & Club / 돌망치 우가")

> 상태: **M1 완료** (이동·점프·터치 조작 + 테스트 맵). 다음: M2.

## 1. 개요

| 항목 | 내용 |
|---|---|
| 장르 | 90년대 DOS 원시인 플랫포머의 플레이 감각을 오마주한 **오리지널** 모바일 웹게임 |
| 독창성 원칙 | 원작의 캐릭터·스프라이트·레벨·음악·명칭 미사용. 주인공/적/맵/사운드 전부 신규 디자인 |
| 스택 | Vite + TypeScript + Phaser 3 (Arcade Physics) |
| 에셋 | 외부 파일 0개. 픽셀아트 = 코드 생성 캔버스 텍스처, 사운드 = WebAudio 합성 |
| 렌더링 | 내부 320x180 → 정수배 스케일, `pixelArt: true`, `image-rendering: pixelated` |
| 배포 | GitHub Pages (`/claudecode/` base), GitHub Actions 자동 배포, PWA 오프라인 |

## 2. 오리지널 디자인 (신규 설정)

| 구분 | 이름(가칭) | 설명 |
|---|---|---|
| 주인공 | 우가 | 붉은 머리, 푸른 털가죽, 뼈 손잡이 돌망치를 든 원시인 |
| 지상 돌진형 | 뿔멧돼지 | 플레이어 발견 시 예비 동작 후 돌진, 벽에 부딪히면 잠시 기절 |
| 비행형 | 익룡새끼 | 사인파 비행, 일정 거리에서 급강하 |
| 투척형 | 돌팔매 원숭이 | 고정 위치에서 포물선으로 돌 투척 |
| 점프형 | 가시개구리 | 주기적 점프로 접근, 공중일 때 밟기 불가 |
| 보스 | 용암 거북 "마그로" | 3페이즈: 돌진 → 화염탄 → 낙석 유도. 등껍질 대신 머리가 약점 |
| 음식 | 고기/열매/물고기/알 | 점수 + 누적 시 추가 목숨 |

## 3. 디렉터리 구조

```
/
├─ index.html              # 뷰포트/safe-area/회전 안내 오버레이
├─ vite.config.ts          # base, PWA 플러그인
├─ public/                 # manifest 아이콘(빌드 스크립트로 생성한 PNG)
├─ src/
│  ├─ main.ts              # Phaser 설정, 정수배 스케일러
│  ├─ config.ts            # 해상도·물리 상수(코요테/버퍼 등)
│  ├─ scenes/              # Boot, Title, Game, UI(HUD), Pause, GameOver, Ending
│  ├─ entities/            # Player, enemies/*, Boss, Projectile, Pickup
│  ├─ systems/
│  │  ├─ input/            # InputState(통합), Keyboard, TouchControls(DOM 오버레이)
│  │  ├─ level/            # LevelLoader(JSON→타일/오브젝트), MovingPlatform, Breakable, Checkpoint
│  │  ├─ audio/            # Synth(SFX), Music(스텝 시퀀서)
│  │  └─ save.ts           # localStorage (진행·최고점·설정)
│  ├─ gfx/                 # 팔레트, 스프라이트/타일 텍스처 생성기
│  └─ levels/              # test.json, forest.json, ice.json, volcano.json
├─ tests/                  # Playwright 스모크 (844x390, touch)
└─ .github/workflows/      # ci.yml(빌드+테스트), deploy.yml(Pages)
```

## 4. 핵심 설계 결정

| 주제 | 결정 | 근거 |
|---|---|---|
| 터치 조작 | Phaser 캔버스 위 **DOM 오버레이 버튼** + Pointer Events, `pointerId`별 추적 | 멀티터치 신뢰성, safe-area(`env()`) 대응, 캔버스 스케일과 독립적 히트 영역 |
| 방향패드 | 좌/우/아래 3버튼, 손가락 슬라이드로 방향 전환 가능 | 엄지를 떼지 않고 좌↔우 전환 |
| 점프 감각 | 코요테 100ms, 점프 버퍼 120ms, 버튼 릴리즈 시 상승 속도 컷(가변 높이) | 요구 사양 |
| 물리 | 고정 60Hz 스텝(Arcade `fixedStep`), 타일 16px | 기기 간 일관된 점프 궤적 |
| 타일맵 | 자체 JSON 포맷(문자 그리드 + 오브젝트 배열) → Phaser Tilemap 동적 레이어 | 외부 에디터 없이 수정·리뷰 가능, diff 가독성 |
| 스케일 | `floor(min(w/320, h/180))` 정수배, 남는 영역은 레터박스 | 픽셀 선명도 |
| 회전 | `screen.orientation.lock('landscape')` 시도 + 세로일 때 CSS 안내 화면 & 게임 일시정지 | iOS는 lock 미지원 → 안내 화면이 실질적 수단 |
| 성능 | 오브젝트 풀(투사체·파티클), 화면 밖 적 비활성화, 텍스처는 부팅 시 1회 생성 | 중급 안드로이드 60fps |
| 테스트 훅 | `window.__game` 디버그 핸들(플레이어 좌표·씬 상태, 스테이지 워프) | Playwright에서 결정적 검증 |
| PWA | `vite-plugin-pwa`(Workbox precache), `display: fullscreen`, `orientation: landscape` | 오프라인 플레이·홈 화면 설치 |

## 5. 조작

| 입력 | 터치 | 키보드 |
|---|---|---|
| 이동 | 좌하단 ◀ ▶ | ← → |
| 숙이기/발판 내려가기 | 좌하단 ▼ | ↓ |
| 점프 | 우하단 A | Z (또는 Space) |
| 공격 | 우하단 B | X |
| 일시정지 | 우상단 ❚❚ | Esc / P |

차단 항목: 더블탭 줌, 핀치, 스크롤/바운스, 길게 누르기 컨텍스트 메뉴, 텍스트 선택.

## 6. 마일스톤

각 마일스톤 종료 조건: **플레이 가능 + `npm run build` 통과 + Playwright 통과 → 멈추고 보고**.

| # | 범위 | 주요 산출물 | 테스트 |
|---|---|---|---|
| **M1** | 이동/점프/터치조작 + 테스트 맵 | Vite/TS/Phaser 스캐폴드, 정수배 스케일, 플레이어 컨트롤러, 터치 오버레이, 회전 안내, 테스트 맵 JSON, 카메라 | 부팅, 터치 이동, 점프(멀티터치) |
| **M2** | 공격/적/체력 | 몽둥이 공격 히트박스, 적 4종, 하트 3·목숨·무적 시간·넉백, 부서지는 블록, 음식/점수 | 공격으로 적 처치, 피격 시 하트 감소 |
| **M3** | 스테이지 3개/보스 | 숲·얼음(미끄러짐)·화산(용암) JSON, 움직이는 발판, 체크포인트, 숨은 보너스 구역, 동굴 출구, 보스전 | 스테이지 클리어 스모크(워프 훅 활용) |
| **M4** | 사운드/UI/세이브 | WebAudio SFX·스테이지별 BGM, 타이틀/일시정지/게임오버/엔딩, HUD 정리, localStorage 세이브·설정(음량) | 세이브 후 리로드 시 진행 유지 |
| **M5** | PWA/배포 | manifest·아이콘·서비스워커, Pages 워크플로, 오프라인 검증 | 오프라인 리로드 부팅, CI 그린 |

## 7. 검증

- Playwright: Chromium, 뷰포트 844x390, `hasTouch: true`, `isMobile: true`
- 스모크: ①부팅(캔버스·씬 활성) ②터치 이동(x 증가) ③점프(y 감소 후 착지) ④스테이지 클리어
- CI: PR마다 `tsc --noEmit` → `vite build` → Playwright
- [확실하지 않음] 실제 중급 안드로이드 기기의 60fps는 이 환경에서 측정 불가. CPU 스로틀 에뮬레이션으로 간접 확인하고, 실기기 확인은 배포 후 요청드림.

## 8. 확인이 필요한 결정 사항

| # | 질문 | 제안(기본값) |
|---|---|---|
| 1 | **브랜치 전략**: 이 세션은 `claude/magical-maxwell-ihfg87` 브랜치에만 푸시하도록 설정되어 있음. 마일스톤별 `feature/m1-…` 브랜치 생성과 main 대상 PR 생성·머지를 허용하시는지? | 허용 시: `feature/mN-*` → main PR, 머지는 사용자가 직접(또는 승인 후 대행) |
| 2 | **위치**: 게임을 저장소 루트에 둘지, 하위 폴더(`game/`)에 둘지? (현재 저장소엔 `.claude/`만 존재) | 루트 |
| 3 | **main 보호 규칙·Pages 활성화**는 저장소 설정(Settings)이라 사용자가 직접 켜야 함 | M5 시점에 안내 |
| 4 | 게임 제목/주인공 이름(가칭 "돌망치 우가") | 가칭 유지 |
| 5 | UI 언어 | 한국어 기본(텍스트는 코드 생성 비트맵 폰트 한계상 영문/숫자 HUD + 한글은 DOM 오버레이) |
