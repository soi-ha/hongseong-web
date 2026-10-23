# 홍성 제안·자료조사 웹

Astro + TypeScript 기반 내부 검토용 정적 사이트. 사용자가 지정한 제안 내용본 v02의 29쪽을 제안서 페이지에 구현했다. A안·B안, 사진 8장, 표 16개, 수치의 가정·협의 조건과 발표자 노트를 포함한다. 자료조사 페이지는 준비 중이다.

배포 주소: **https://honeseong-web.sy-choe.workers.dev/**

Cloudflare Workers Static Assets · Worker `honeseong-web` · 2026-10-23 첫 배포. Version ID: `f3b54f3b-3a4d-44a2-b265-00d1f7b74336`. 기존 로그인 상태를 사용했으며 새 로그인·별도 도메인 연결은 수행하지 않았다.

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
| `src/pages/index.astro` → `/` | 제안 v02, 8개 구간 목차와 현재 위치 표시 |
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

목차는 제안 개요 → A안 코스 → A안 운영 → A안 성과·협의 → B안 구성 → B안 운영·성과 → 비교·추진 → 근거·조건으로 구성했다. 원문 목차와 각 항목의 출처·발표자 노트는 펼쳐 읽는다. 표는 작은 화면에서 가로 스크롤하며, 사진은 실제 비율과 현장/해외 참고 구분을 유지한다. JavaScript 없이도 본문·목차 이동·노트 열람이 가능하다.

기준은 기존 홍성 프로젝트의 `문서/261023_홍성_관광객유치_제안_A안·B안_v02.md`. 별도 v03 PPT로 바꾸지 않았다. 원본 전체 복사나 원본 수정 없이 선택한 내용본과 연결된 사진 8장만 사용했다. 복사본 SHA-256: `13941d277ec2d0a2bd8d1c0f6d92bd92bfca03d718972573377d104f917c10ce`. 내용 개정 시 이 복사본을 갱신하고 비교 검수하며, 해당 원본·버전 기록도 함께 갱신한다.

사용자가 2026-10-23 내부 검토용으로 사진 8장 사용을 지시했다. 원문에 기록된 사진 권리 확인 상태와 출처는 그대로 보존했으며 사용권 확보로 간주하지 않는다. 사진은 WebP(품질 86, 최대 너비 1600px, 확대·크롭 없음)로 변환해 합계 1,691,432바이트로 제공한다. 원본 워터마크도 유지했다.

검토본 표기와 `noindex, nofollow, noarchive`, robots 제외 요청을 적용했다. **검색 제외는 접근 제한이 아니다. 별도 로그인 없이 URL로 접근 가능하다.** 인증된 내부 공개 범위가 필요하면 별도로 접근 제어를 결정한다. React·SSR·Worker 처리 코드·DB·로그인·CMS·관리자 기능은 추가하지 않았다. 자료조사 카드·상세·모달·PPT 다운로드는 미구현이다.

메뉴명·사이트명·웹 세부 배치는 현재 구현값이다. 사용자 지정 색상·서체와 개별 웹 디자인의 최종 승인을 구분한다. 다른 사이트의 브랜드 자산은 복제하지 않았다. Workers는 정적 자산만 사용하며 `main`·서버 바인딩은 없고, Astro `trailingSlash: always`와 Workers `force-trailing-slash`를 맞췄다. SPA fallback·도메인 연결·GitHub 원격 생성·push는 수행하지 않았다.

## 웹 디자인 적용

2026-10-23 사용자 요청: 기존 PPT 가이드에서 웹에도 적용 가능한 색상·서체를 사용하고 크기·굵기는 웹에 맞게 조정. 기존 홍성 프로젝트의 `가이드/261023_홍성_PPT디자인가이드_v15.md` 3~8절을 기준으로 적용했다. PPT 고정 좌표·슬라이드 규격은 옮기지 않고 웹의 읽기 흐름으로 재구성했다. 기본 밝은 화면을 유지하며 다크는 별도 지정 범위가 있을 때 적용한다.

| 역할 | 웹 적용 |
| --- | --- |
| 제목·주요 선 | 가이드 Accent `#0380B7` |
| 본문 / 메뉴·헤더 제목 | `#4A4A4A` / `#353535` |
| 배경 / 정보면 / 구분선 | `#FFFFFF` / `#EBF5F9` / `#CCDCE3` |
| 보조 글자 | `#6B6B6B`. PPT 조건 주석색 `#9A9A9A`는 작은 웹 글자에 사용하지 않음 |
| 한국어와 그 안 영문·숫자 | A2Z Regular 400, 제목·소제목은 실제 SemiBold 600 파일 사용 |
| 독립 영문 대제목 | Bebas Neue Bold 700, `.display-title`로 명시하는 경우에만 사용. 표지·구간 영문에 적용 |
| 글자 크기 | 본문 모바일 16px·데스크톱 17px, 메뉴 16px, 구간 제목 30~52px, 본문 제목 24~32px, 표지 영문 64~102px |
| 줄간격·자간 | 본문 1.75, 제목 1.3, 기본 자간 0. 가짜 굵기 합성 비활성화 |

크기·굵기·줄간격은 사용자에게 조정을 위임받아 선택한 웹 구현값이며 개별 수치 확정과 구분한다. 제목색은 큰 글자에 적용하고, 16px 메뉴는 진회색 글자와 파랑 밑줄로 선택을 표시한다. 본문 일부의 임의 볼드는 추가하지 않았다. 작은 버튼의 대비를 위해 Accent의 짙은 변형 `#026591`, 구간 바탕 `#F7FAFB`를 추가했다.

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

## 다음 작업

1. A안·B안의 웹 화면 배치와 메뉴명 검토.
2. 조사자료 분류·카드 항목 및 상세 페이지/모달 방식 결정.
3. 원문에 남은 수치 출처, 장소·지원·협찬 조건, 담당 연락처와 사진 사용권 확인. 사업 내용의 검증 완료나 실행 확정으로 해석하지 않음.
4. 필요 시 접근 제어·별도 도메인 결정. GitHub 원격 생성과 push는 별도 요청 범위.
