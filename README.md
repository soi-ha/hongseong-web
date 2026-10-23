# 홍성 제안·자료조사 웹

Astro + TypeScript 기반 내부 검토용 정적 사이트. 최신 제안 PPT v03의 30쪽을 같은 배치로 표시하며 전체 화면 발표를 지원한다. 기존 내용본 v02의 29쪽 본문·표·사진·수치의 가정·협의 조건·발표자 노트는 ‘본문·출처’에서 열람할 수 있다. 30쪽은 v03 클로징이며 자료조사 페이지는 준비 중이다.

배포 주소: **https://honeseong-web.sy-choe.workers.dev/**

Cloudflare Workers Static Assets · Worker `honeseong-web` · 2026-10-23 첫 배포. 최신 Version ID: `1e38ecf7-7815-4a4a-abc6-58803309333c`. 기존 로그인 상태를 사용했으며 새 로그인·별도 도메인 연결은 수행하지 않았다.

**현재 로컬 변경: 최신 PPT v03의 30쪽 재현·전체 화면 슬라이드쇼·하단 조작부 정리. 아직 배포하지 않았다.** 사용자 지정에 따라 변경은 localhost에서 먼저 확인하며, 해당 변경의 배포를 명시적으로 요청받기 전에는 배포하지 않는다. 위 배포 주소는 이전의 연속 스크롤 버전이다.

## 실행 환경

2026-10-23 설치·검증 기준. macOS 27.0.1 / Apple Silicon(arm64).

| 도구 | 사용 버전 | 선택 근거 |
| --- | --- | --- |
| Node.js | 26.9.0 | 기존 설치 유지, `.nvmrc`에 검증 버전 고정 |
| npm | 11.19.1 | 기존 설치 유지, `packageManager` 및 잠금 파일 사용 |
| Astro | 7.4.2 | 공식 npm `latest` 안정 버전 |
| TypeScript | 6.0.3 | `@astrojs/check` 지원 범위 내 6.x 안정 버전 |
| @astrojs/check | 0.9.12 | Astro 파일·TypeScript 검사 |
| Wrangler | 4.152.0 | Workers Static Assets 로컬 검증·배포 도구 |
| @astrojs/markdown-satteri | 0.4.5 | 설치된 Astro와 같은 공식 Markdown 처리기, 빌드 시에만 사용 |

확인 당시 Astro의 Node 요구 조건은 `>=22.23.4`, Wrangler는 `>=22.0.0`. 이 저장소의 Node 허용 범위는 `package.json`에 명시했다. Node 26은 현재 Current 계열이며 LTS가 아니다. Node 24.22.1 LTS도 허용 범위이나 이번 실행 검증은 Node 26.9.0에서만 수행했다. 전역 Node·npm·Git 설정은 변경하지 않았다.

TypeScript `latest`는 7.0.2였지만 `@astrojs/check@0.9.12`의 peer 지원 범위가 `^5.0.0 || ^6.0.0`이므로 6.0.3 사용. 직접 의존성은 정확한 버전으로 고정하고 전체 의존성은 `package-lock.json`으로 관리한다. npm 설치 스크립트는 확인한 `esbuild@0.28.2`, `workerd@1.20261019.1`만 `allowScripts`에 명시했다.

## 로컬 실행

이 README가 있는 `honeseong-web` 폴더에서 실행한다. 폴더명 철자는 그대로 유지한다.

```sh
node --version
npm --version
npm ci
npm run dev
```

기본 주소: <http://127.0.0.1:4321/>. nvm을 이미 사용하는 환경에서는 설치 전에 `nvm install` 및 `nvm use`로 `.nvmrc`를 적용할 수 있다. nvm 자체는 이번에 설치하지 않았다. 환경 변수나 비밀값은 현재 필요 없으므로 `.env.example`도 만들지 않았다.

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | Astro 개발 서버, 기본 포트 4321 |
| `npm run check` | Astro·TypeScript 타입 검사 |
| `npm run build` | 정적 결과를 `dist/`에 생성 |
| `npm run check:content` | 빌드 후 원문 29절·표·노트·사진·앵커 누락 검사 |
| `npm run preview` | 빌드 결과의 Astro 로컬 미리보기, 기본 포트 4321 |
| `npm run preview:workers` | 빌드 결과의 Workers 로컬 미리보기, 포트 8787 |
| `npm run deploy:check` | 빌드·내용 검수 후 `wrangler deploy --dry-run`, 실제 업로드·배포 없음 |
| `npm run deploy` | 타입 검사·빌드·내용 검수 후 실제 Workers 배포. 사용자 배포 요청 시 실행 |

미리보기는 `npm run build` 후 실행한다. 개발 서버와 Astro 미리보기를 동시에 쓰려면 한쪽에 `-- --port 4322`를 붙인다. 모든 로컬 서버는 `127.0.0.1`에만 바인딩한다.

## 구현 범위와 구조

| 위치 | 역할 |
| --- | --- |
| `src/pages/index.astro` → `/` | PPT v03 30쪽·구간 목차·하단 조작부·본문/출처 대체 보기 |
| `src/scripts/proposal-reader.ts` | 페이지·키보드·전체 화면·본문 보기·URL과 방문 기록 동기화 |
| `src/content/proposal-slides.json`, `public/slides/proposal-v03/` | 최종 PPT/PDF 기준 해시와 30쪽 4K 무손실 화면 |
| `scripts/import-proposal-slides.py` | 검수한 최종 PDF를 웹 화면으로 변환. 원본 읽기 전용 |
| `src/pages/research.astro` → `/research/` | 자료조사 준비 중 |
| `src/content/proposal-v02.md` | 사용자 지정 원문 내용본의 동일 복사본; 본문 기준 한 곳 |
| `src/content/proposal-photos.json` | 사진 출처·사용권 기록·크기·원본 해시 |
| `src/lib/proposal.ts` | 29절을 빌드 시 렌더링; 숫자 범위 보존·표·목차·노트 연결 |
| `src/components/ProposalSection.astro`, `ProposalPhoto.astro` | 본문·사진·출처 링크 공통 표현 |
| `src/components/SiteHeader.astro` | 사이트 간 메뉴; 제안서 내부 목차와 별개 |
| `src/layouts/BaseLayout.astro` | 한국어 문서·공통 헤더·검색 제외 메타 정보 |
| `src/styles/global.css`, `proposal.css` | 공통 디자인 변수와 제안서 반응형 배치 |
| `public/fonts/`, `public/images/proposal/` | 자체 제공 웹폰트·최적화 사진 8장 |
| `public/robots.txt`, `public/_headers` | 검색 제외 요청·정적 응답 헤더 |
| `scripts/verify-proposal.mjs` | 빌드 HTML과 원문 텍스트·표 순서·조건 대조 |
| `wrangler.jsonc` | 정적 자산 `./dist`, Worker `honeseong-web` |

목차는 제안 개요 → A안 코스 → A안 운영 → A안 성과·협의 → B안 구성 → B안 운영·성과 → 비교·추진 → 근거·조건으로 구성했다. 하단 왼쪽에는 현재/전체 쪽수와 ‘본문·출처’, 오른쪽에는 전체 화면·이전·다음을 배치했다. 중앙 선택 상자는 제거했으며 하단 여백은 데스크톱32px·모바일24px에 기기 안전 영역을 더한다. 내부 목차는 해당 시작 쪽으로 이동한다. `#page-16` 같은 직접 링크·새로고침·뒤로/앞으로 가기를 지원하며 처음·끝 방향 버튼은 비활성화한다.

전체 화면 버튼 또는 `F`로 발표를 시작하고 `Esc`로 종료한다. `←`/`→`, `PageUp`/`PageDown`으로 이동하고 `Home`/`End`로 처음/마지막 쪽에 간다. 발표 중 `↑`/`↓`와 `Space`/`Shift+Space`도 지원한다. 발표 모드에서는 사이트 메뉴가 숨겨지고 조작부는2.2초 뒤 자동으로 숨는다. 포인터 이동·키보드 포커스로 다시 표시된다. 전체 화면을 지원하지 않거나 거절된 환경은 안내 후 창 안 발표 모드로 전환한다. [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)의 사용자 동작 요구와 `fullscreenchange` 이벤트를 따른다.

슬라이드는16:9 전체 화면을 함께 확대·축소하여 원본 배치를 유지한다. 좁은 화면에서 큰 글자로 읽거나 내용을 선택·복사할 때는 ‘본문·출처’를 사용한다. 이 보기의 긴 내용만 스크롤되며 표 내부 방향키는 표 스크롤에 사용한다. 출처 펼침 제목은 ‘출처’로 유지한다. JavaScript가 꺼져 있으면 전체 슬라이드와 본문을 이어서 표시한다. Astro 개발 도구 모음은 하단 조작을 가리지 않도록 비활성화했다.

텍스트 기준은 기존 홍성 프로젝트의 `문서/261023_홍성_관광객유치_제안_A안·B안_v02.md`. 복사본 SHA-256: `13941d277ec2d0a2bd8d1c0f6d92bd92bfca03d718972573377d104f917c10ce`. 이번 사용자 요청으로 시각 기준은 같은 문서 폴더의 최종 `261023_홍성_관광객유치_제안_A안·B안_v03.pdf`로 변경했다. v02→v03의29쪽 문구·수치·사진·발표자 노트는 현재 PPT XML·사진 해시 대조에서 동일하며 클로징만30쪽에 추가되었다. 중간 작업본 `native-qa.pdf`는 최종 PDF와 달라 사용하지 않는다. 원본 PPT/PDF·기존 자료는 수정하거나 저장소에 전체 복사하지 않았다.

최종 PDF 해시 `b4f2da32468aae76ad304176f66b3c5d3e6d89285791ed7751ff323ab57977f2`, PPT 해시 `f8bf0632e1b36149eadfd952f19dc7ce4037be68e04b6ebbf42b7ee3c1cbc82f`. 720×405pt 원본을3840×2160px 무손실 WebP로 변환하여30장 합계14,363,694바이트를 제공한다. 변환 전후 디코딩 픽셀 일치 확인. 임시 Python 환경의 PyMuPDF1.26.5·Pillow11.3.0만 사용하며 npm 의존성은 변경하지 않았다. 현재 쪽과 인접 쪽부터 로드한다. 슬라이드 화면 자체는 이미지이며 편집 가능한 HTML 객체가 아니다. 내용 개정 시 원본과 텍스트 복사본을 함께 대조하고 슬라이드를 다시 변환한다.

사용자가 2026-10-23 내부 검토용으로 사진 8장 사용을 지시했다. 원문에 기록된 사진 권리 확인 상태와 출처는 그대로 보존했으며 사용권 확보로 간주하지 않는다. 사진은 WebP(품질 86, 최대 너비 1600px, 확대·크롭 없음)로 변환해 합계 1,691,432바이트로 제공한다. 원본 워터마크도 유지했다.

검토본 표기와 `noindex, nofollow, noarchive`, robots 제외 요청을 적용했다. **검색 제외는 접근 제한이 아니다. 별도 로그인 없이 URL로 접근 가능하다.** 인증된 내부 공개 범위가 필요하면 별도로 접근 제어를 결정한다. React·SSR·Worker 처리 코드·DB·로그인·CMS·관리자 기능은 추가하지 않았다. 자료조사 카드·상세·모달·PPT 다운로드는 미구현이다.

메뉴명·사이트명·웹 세부 배치는 현재 구현값이다. 사용자 지정 색상·서체와 개별 웹 디자인의 최종 승인을 구분한다. 다른 사이트의 브랜드 자산은 복제하지 않았다. Workers는 정적 자산만 사용하며 `main`·서버 바인딩은 없고, Astro `trailingSlash: always`와 Workers `force-trailing-slash`를 맞췄다. SPA fallback·도메인 연결·GitHub 원격 생성·push는 수행하지 않았다.

## 웹 디자인 적용

최신 사용자 요청에 따라 가이드 v15를 적용한 PPT v03의 페이지별 조판을 그대로 표시한다. 2~15쪽은 흰색, 16~29쪽은 다크, 1쪽 표지와30쪽 클로징은 승인된 어두운 사진 처리다. 사진의 프레임·크롭·워터마크, 표의 열폭·선·정렬, 글자 크기·굵기·자간을 PDF 출력 그대로 보존한다. 하단 웹 조작부는 슬라이드 바깥에 두고 현재 쪽의 밝은/다크 색상을 따른다. 공통 사이트 메뉴·내부 목차는 밝게 유지한다.

아래 CSS 값은 사이트 조작부와 선택 가능한 ‘본문·출처’ 보기의 기준이다. 슬라이드 이미지의 PPT 조판을 이 값으로 다시 구성하지 않는다.

| 역할 | 웹 적용 |
| --- | --- |
| 제목·주요 선 | 가이드 Accent `#0380B7` |
| 본문 / 메뉴·헤더 제목 | `#4A4A4A` / `#353535` |
| 배경 / 정보면 / 구분선 | `#FFFFFF` / `#EBF5F9` / `#CCDCE3` |
| 보조 글자 | `#6B6B6B`. PPT 조건 주석색 `#9A9A9A`는 작은 웹 글자에 사용하지 않음 |
| 한국어와 그 안 영문·숫자 | A2Z Regular 400, 제목·소제목은 실제 SemiBold 600 파일 사용 |
| 독립 영문 대제목 | Bebas Neue Bold 700, `.display-title`로 명시하는 경우에만 사용. 표지·페이지 영문 라벨에 적용 |
| 글자 크기 | 본문 모바일 16px·데스크톱 17px, 메뉴 16px, 본문 제목 24~32px, 표지 영문 56~80px |
| 줄간격·자간 | 본문 1.75, 제목 1.3, 기본 자간 0. 가짜 굵기 합성 비활성화 |

다크 구간: 배경 `#102832`, 제목 `#49B5E5`, 본문·표 본문 `#E0E6E9`, 표 헤더 글자 `#F1F4F5`·배경 `#1C3C4B`, 보조·조건 주석 `#AAB8BF`, 구분선 `#3B5663`·표 가로선 `#49B5E5`. 공통 변수의 명시적 `data-theme="dark"` 적용으로 범위를 한정하며 사진에 필터·오버레이를 추가하지 않는다.

크기·굵기·줄간격은 사용자에게 조정을 위임받아 선택한 웹 구현값이며 개별 수치 확정과 구분한다. 제목색은 큰 글자에 적용하고, 사이트 메뉴는 진회색 글자와 파랑 밑줄로 선택을 표시한다. 본문 일부의 임의 볼드는 추가하지 않았다. 작은 버튼의 대비를 위해 Accent의 짙은 변형 `#026591`을 사용한다. 이전의 구간별 교대 배경은 제거했다.

웹폰트 원본은 기존 프로젝트 `문서/템플릿/서체/원본재현_보완/`의 A2Z v1.001 Regular·SemiBold와 Bebas Neue FontFabric 2014 Bold. 해당 TTF만 WOFF2로 변환하고 원본은 변경하지 않았다. 글리프 범위·이름·굵기 정보를 대조했으며 서브셋 삭제 없이 합계 259,564바이트(약 254KiB)로 제공한다. 변환 도구 fontTools 4.60.2·Brotli 1.2.1은 임시 도구 환경에서만 사용했으며 npm 의존성은 변경하지 않았다.

서체 설치 없이 같은 파일을 제공하도록 `@font-face`와 `font-display: swap` 적용. 한글 문맥의 영문을 Bebas로 자동 치환하지 않으며 A2Z 미지원 기호는 폴백 서체를 사용한다. 원본 저작권·라이선스는 [A2Z OFL](./public/fonts/A2Z-OFL.txt), [Bebas OFL](./public/fonts/Bebas-OFL.txt)에 보존. 기존 출처 기록이 연결한 공식 배포 위치는 [A2Z](https://github.com/Freesentation/A2Z/tree/main/v1.001), [Bebas Neue 2014](https://github.com/dharmatype/Bebas-Neue/tree/master/fonts/BebasNeue(2014)ByFontFabric)이며 이번에는 기존 보관 파일을 사용했다.

## 자료와 작업 기준

- 저장소 개발 규칙: [AGENTS.md](./AGENTS.md)
- 기존 참고 분석: [261023_홍성_웹참고사이트_레이아웃분석_v01.md](./261023_홍성_웹참고사이트_레이아웃분석_v01.md). 원문 변경 없이 보존했으며, 이번 신규 설정 커밋에는 포함하지 않는다.
- 기존 홍성 프로젝트: `/Users/amx-0243/Library/CloudStorage/OneDrive-Automanix/Soha_Repo/03_프로젝트/2027_홍성`. 해당 `AGENTS.md`·`프로젝트_총괄.md`에서 필요한 기준과 자료 위치를 확인했다. 기존 PPT·조사자료 전체 복사와 원본 수정은 수행하지 않았다. 다른 기기에서는 실제 저장소 위치를 확인한다.
- 웹의 현재 실행 환경·구현 상태는 이 README에서 관리한다. 기존 홍성 총괄의 ‘개발 도구 미선정’은 이번 초기화 이전 기록이며 이번 작업에서는 외부 총괄을 수정하지 않았다.

선정 시 확인한 공식 자료: [Astro Markdown](https://docs.astro.build/en/guides/markdown-content/), [공식 Sätteri API](https://docs.astro.build/en/reference/markdown-processors/satteri/), [Astro 설치](https://docs.astro.build/en/install-and-setup/), [Astro 설정](https://docs.astro.build/en/reference/configuration-reference/), [Node 릴리스](https://nodejs.org/en/about/previous-releases), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/), [HTML 경로 처리](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [Wrangler deploy](https://developers.cloudflare.com/workers/wrangler/commands/workers/#deploy). 패키지 버전·peer 조건은 공식 npm 레지스트리의 `npm view` 결과와 설치된 `npm ls --depth=0`으로 대조했다.

## 검증 기록 — 2026-10-23

- 최초 환경 설정과 서체 적용 후 두 페이지·Workers 로컬 실행·Git 제외 대상 검사 완료.
- 이번 내용 구현: 의존성 설치 성공, npm audit 취약점 0건. 기존 버전 유지, Markdown 처리기 0.4.5 직접 의존성 고정.
- `npm run check`: 오류·경고·힌트 0건. `npm run build`: 정적 페이지 2개 생성.
- `npm run check:content`: 29절, 표 16개(셀 순서 포함), 사진 8장, 노트 29개, 조건·사례 블록 22개, 원문 텍스트 459개 블록 보존 확인. 중복 ID·내부 링크·누락 이미지 검사 통과. 숫자 범위의 `~`를 Markdown 취소선으로 해석하지 않도록 처리.
- 외부 원문과 저장소 복사본 바이트 일치. 별도 읽기 전용 내용 검수에서도 제목·문단·표·조건·단계 누락 없음 확인.
- `npm run deploy:check`: 정적 자산 dry-run 성공.
- Chrome 1280×900·390×844 실제 화면 확인. 가로 넘침 없음. 내부 목차 이동·현재 위치 표시, 모바일 목차 자동 가로 이동, 키보드 표 스크롤, 출처 노트 펼침, 제안서↔자료조사 왕복 확인. 수집된 브라우저 오류·경고 없음. 실제 휴대폰·다른 브라우저 검증은 미수행.
- Workers 로컬 `/`·`/research/`·사진 HTTP 200, `/research` → `/research/` 307, 없는 경로 404, `X-Robots-Tag` 적용 확인.
- 실제 `npm run deploy` 성공. 배포 주소의 HTML이 검증한 로컬 빌드와 바이트 일치. 두 페이지·사진 8장·웹폰트 3개·CSS·robots HTTP 200, 경로 정규화 307·없는 경로 404 확인. 배포 주소에서도 데스크톱·모바일 화면과 페이지 이동 확인.
- 개발 서버 `http://127.0.0.1:4321/` 유지. 개발 서버를 종료한 뒤에는 `npm run dev`로 다시 시작해야 로컬 주소가 열린다. 배포 주소는 로컬 서버 실행과 무관하다.
- Git 제외 대상 재확인. 이번 작업 파일만 커밋하고, 기존 미추적 레이아웃 분석 파일은 원래 상태로 보존. 전역 Git 설정 변경·원격 생성·push 없음.

### B안 이후 다크·출처 제목 수정 — 2026-10-23

- 사용자 요청으로 B안 시작부터 비교·추진·부록·푸터에 가이드 v15의 다크 역할색 적용. 출처 펼침 제목 29곳을 ‘출처’로 변경하고 원문 내용본은 보존.
- 타입 검사·빌드·내용 대조 통과. Chrome 1280×900·390×844에서 다크 제목·본문·표·출처 색상, 가로 넘침 없음과 출처 펼침 확인. 동일 주소에 재배포하고 실제 배포 화면 반영 확인.

### 페이지 넘기기·A안 배경 통일 — 2026-10-23, 로컬만 반영

- 29쪽을 좌우 버튼으로 넘기는 방식으로 변경. 표지·개요·A안은 흰 배경으로 통일하고 16쪽부터 다크 배경 유지. 배포 명령은 실행하지 않음.
- 타입 검사 오류·경고·힌트 0건, 정적 2페이지 빌드 및 원문 대조 검사 통과. 기존 내용·사진·표·출처 수 유지.
- Chrome 1280×900·390×844에서 29쪽 전체를 선택 메뉴로 전환하여 한 쪽만 표시, 문서 가로 넘침 없음, 하단 버튼 유지 확인. 320×740에서도 이동 버튼·선택 메뉴가 화면 안에 표시됨.
- 이전·다음, 좌우 방향키, 구간 목차, 15→16쪽의 색 전환, 브라우저 뒤로/앞으로 가기, 현재 쪽 새로고침, 출처 펼침과 다음 쪽 스크롤 초기화 확인.
- 접근성 검토에서 ‘본문으로 이동’ 사용 시 표지로 돌아가는 문제를 수정하고, 처음·끝 쪽에서 버튼이 비활성화되면 본문 영역으로 포커스를 이동하도록 보완. 실제 TypeScript를 최소 DOM 모형에서 실행한 해시·방문 기록·포커스 회귀 검사 6건 통과. 최종 보완 후 브라우저 도구 연결이 중단되어 이 두 동작의 실제 화면 재확인은 미수행. 실제 휴대폰·다른 브라우저는 미검증.
- 개발 서버 `http://127.0.0.1:4321/` 실행 상태와 두 페이지 HTTP 200 확인. 변경 파일은 로컬 Git에서 관리하며 기존 분석 파일은 미추적 상태 보존.

### PPT v03 재현·전체 화면 발표 — 2026-10-23, 로컬만 반영

- 최종 PPT/PDF v03의 30쪽을 3840×2160 무손실 WebP로 변환. 모든 이미지의 디코딩 픽셀을 PDF 렌더 결과와 대조했으며 최종 30쪽 미리보기에서 글자·표·사진 배치 확인.
- 타입 검사 오류·경고·힌트 0건, 정적 2페이지 빌드 성공. 원문 29절·표 16개·사진 8장·노트 29개·조건 22개·텍스트 459개 블록과 슬라이드 30개 해시·파일 형식·내부 링크 검사 통과.
- 실제 Chrome에서 전체 화면 버튼 진입·Esc 종료, 좌우 방향키, Home/End, 처음·끝 버튼 비활성화, 구간 이동과 전체 화면 조작부 자동 숨김 확인.
- 실제 TypeScript를 최소 DOM 모형에서 실행해 페이지·방문 기록·포커스·본문 전환·F/Esc·전체 화면 이벤트·미지원/거절 시 대체 동작을 검사. 발표 전후 사이트 메뉴의 기존 inert 상태 복원도 4개 초기 조합과 반복 전환으로 확인.
- 최종 본문·출처 버튼 및 모바일 화면 재검증 중 브라우저 제어·화면 캡처 연결 오류 발생. 해당 항목은 코드·DOM 검사까지 완료했고 최신 실제 모바일 화면·실제 휴대폰·다른 브라우저 검증은 미수행.
- 개발 서버 `http://127.0.0.1:4321/` 유지, 제안서·자료조사·슬라이드 이미지 HTTP 200 확인. 배포·push·원본 PPT/PDF 수정 없음.

## 다음 작업

1. localhost에서 최신 PPT 화면·전체 화면 발표·조작부 검토. 실제 배포는 사용자의 명시적 요청 후 수행.
2. 조사자료 분류·카드 항목 및 상세 페이지/모달 방식 결정.
3. 원문에 남은 수치 출처, 장소·지원·협찬 조건, 담당 연락처와 사진 사용권 확인. 사업 내용의 검증 완료나 실행 확정으로 해석하지 않음.
4. 필요 시 접근 제어·별도 도메인 결정. GitHub 원격 생성과 push는 별도 요청 범위.
