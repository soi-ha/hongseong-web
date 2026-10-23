# 홍성 제안·자료조사 웹

Astro + TypeScript 기반 정적 사이트. 현재는 두 페이지의 실행 확인용 골격이며, Cloudflare Workers Static Assets 배포 설정까지 준비했다. 로그인·리소스 생성·실제 배포·도메인 연결은 수행하지 않았다.

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
| `npm run preview` | 빌드 결과의 Astro 로컬 미리보기, 기본 포트 4321 |
| `npm run preview:workers` | 빌드 결과의 Workers 로컬 미리보기, 포트 8787 |
| `npm run deploy:check` | 빌드 후 `wrangler deploy --dry-run`, 실제 업로드·배포 없음 |
| `npm run deploy` | 빌드 후 실제 Workers 배포. 후속 배포 요청 시에만 실행 |

미리보기는 `npm run build` 후 실행한다. 개발 서버와 Astro 미리보기를 동시에 쓰려면 한쪽에 `-- --port 4322`를 붙인다. 모든 로컬 서버는 `127.0.0.1`에만 바인딩한다.

## 구현 범위와 구조

| 위치 | 역할 |
| --- | --- |
| `src/pages/index.astro` → `/` | 제안서 제목·준비 중 표시 |
| `src/pages/research.astro` → `/research/` | 자료조사 제목·준비 중 표시 |
| `src/components/SiteHeader.astro` | 사이트 메뉴와 현재 페이지 표시 |
| `src/layouts/BaseLayout.astro` | 한국어 문서·메타 정보·공통 헤더·본문·본문 바로가기 |
| `src/styles/global.css` | 색·서체·크기·간격 공통 변수 및 모바일 배치 |
| `astro.config.mjs`, `tsconfig.json` | 정적 출력·디렉터리형 경로·엄격한 타입 검사 |
| `wrangler.jsonc` | 이름 후보 `honeseong-web`, 배포 자산 `./dist` |

상단 사이트 메뉴와 제안서 내부 목차는 별개다. 내부 목차는 아직 구현하지 않았으며, 필요할 때 본문의 `page-navigation` 슬롯에 배치한다. 실제 PPT 내용, 조사 카드, 상세 페이지·모달은 미구현. React·SSR 어댑터·Worker 처리 코드·DB·로그인·CMS·관리자 기능은 추가하지 않았다.

메뉴명 ‘제안서’·‘자료조사’, 사이트명, 경로, 중립색·글자 크기·여백은 이번 골격의 임시값이다. 확정 디자인이 아니다. 서체 목록은 Pretendard를 우선하지만 웹폰트 파일은 포함하지 않아 기기 설치 상태에 따라 시스템 한글 서체로 대체된다. 참고 사이트의 색·로고·사진을 복제하지 않았다.

Workers는 정적 자산만 사용하며 `main`·서버 바인딩은 없다. Astro의 `trailingSlash: always`와 Workers의 `force-trailing-slash`를 맞췄다. SPA fallback은 사용하지 않는다. 계정·도메인·Worker 이름 가용성은 실제 배포 단계에서 확인해야 한다.

## 자료와 작업 기준

- 저장소 개발 규칙: [AGENTS.md](./AGENTS.md)
- 기존 참고 분석: [261023_홍성_웹참고사이트_레이아웃분석_v01.md](./261023_홍성_웹참고사이트_레이아웃분석_v01.md). 원문 변경 없이 보존했으며, 이번 신규 설정 커밋에는 포함하지 않는다.
- 기존 홍성 프로젝트: `/Users/amx-0243/Library/CloudStorage/OneDrive-Automanix/Soha_Repo/03_프로젝트/2027_홍성`. 해당 `AGENTS.md`·`프로젝트_총괄.md`에서 필요한 기준과 자료 위치를 확인했다. 기존 PPT·조사자료 전체 복사와 원본 수정은 수행하지 않았다. 다른 기기에서는 실제 저장소 위치를 확인한다.
- 웹의 현재 실행 환경·구현 상태는 이 README에서 관리한다. 기존 홍성 총괄의 ‘개발 도구 미선정’은 이번 초기화 이전 기록이며 이번 작업에서는 외부 총괄을 수정하지 않았다.

선정 시 확인한 공식 자료: [Astro 설치](https://docs.astro.build/en/install-and-setup/), [Astro 설정](https://docs.astro.build/en/reference/configuration-reference/), [Node 릴리스](https://nodejs.org/en/about/previous-releases), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/), [HTML 경로 처리](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [Wrangler deploy](https://developers.cloudflare.com/workers/wrangler/commands/workers/#deploy). 패키지 버전·peer 조건은 공식 npm 레지스트리의 `npm view` 결과와 설치된 `npm ls --depth=0`으로 대조했다.

## 검증 기록 — 2026-10-23

- 의존성 설치 성공, 설치 시 npm audit 취약점 0건. `package.json`과 lockfile 직접 의존성 일치 확인.
- `npm run check`: 오류·경고·힌트 각 0건. `npm run build`: 정적 페이지 2개 생성.
- `npm run deploy:check`: dry-run 성공. Cloudflare 로그인·자산 업로드·배포·리소스 생성 미수행.
- 개발 서버(4322)와 Astro 미리보기(4321)의 `/`, `/research/` 모두 HTTP 200. Chrome에서 두 메뉴 왕복 이동·현재 메뉴 표시 확인.
- Chrome 1280×800, 390×844에서 두 페이지 실제 화면 확인. 제목·안내·메뉴 잘림 및 가로 넘침 없음, 수집된 브라우저 오류·경고 없음. 실제 휴대폰과 다른 브라우저 검증은 미수행.
- Workers 로컬 미리보기의 두 페이지 HTTP 200, `/research` → `/research/` HTTP 307, 존재하지 않는 경로 HTTP 404 확인.
- `.gitignore`의 설치·빌드·캐시·환경 파일 제외와 `.env.example` 예외 확인. 기존 분석 파일 SHA-256 변경 없음.

## 다음 작업

1. 웹에 반영할 PPT 버전·공개 범위와 제안서 내부 목차 결정.
2. 조사자료 분류·카드 항목 및 상세 페이지/모달 방식 결정.
3. 실제 디자인 단계에서 필요한 참고 화면 재확인 후 메뉴명·색·서체·간격 검토.
4. 배포 요청 시 Cloudflare 계정·이름·접근 범위·도메인 확인 후 로그인 및 배포. GitHub 원격 생성과 push는 별도 작업.
