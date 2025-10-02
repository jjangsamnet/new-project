# 웹 서버 배포 가이드

GitHub에서 다른 웹 서버로 프로젝트를 이전하는 전체 가이드입니다.

---

## 📋 목차

1. [배포 전 준비사항](#1-배포-전-준비사항)
2. [서버 환경별 배포 방법](#2-서버-환경별-배포-방법)
3. [Firebase 설정](#3-firebase-설정)
4. [관리자 계정 설정](#4-관리자-계정-설정)
5. [배포 후 확인사항](#5-배포-후-확인사항)
6. [문제 해결](#6-문제-해결)

---

## 1. 배포 전 준비사항

### ✅ 체크리스트

#### 필수 파일 확인
- [ ] `firebase-config.local.js` 생성 (Firebase 설정)
- [ ] `admin-config.local.js` 생성 (개발 환경만 필요)
- [ ] `.gitignore` 확인 (민감 정보 제외)

#### Firebase 설정 완료
- [ ] Firebase 프로젝트 생성
- [ ] Authentication 활성화
- [ ] Firestore Database 생성
- [ ] Storage 활성화
- [ ] App Check 설정 (reCAPTCHA v3)
- [ ] 관리자 계정 생성

> Firebase 설정이 완료되지 않았다면 `FIREBASE_SETUP_GUIDE.md` 참고

---

## 2. 서버 환경별 배포 방법

### 방법 1: GitHub Pages (무료, 간단)

#### 단계 1: Repository 설정
```bash
# 1. GitHub에 Push
git add -A
git commit -m "Prepare for deployment"
git push origin main

# 2. GitHub Repository 페이지로 이동
# Settings → Pages
```

#### 단계 2: GitHub Pages 활성화
1. **Source:** `Deploy from a branch` 선택
2. **Branch:** `main` 선택, 폴더: `/ (root)` 선택
3. **Save** 클릭
4. 5분 후 `https://yourusername.github.io/repository-name/` 접속 가능

#### 단계 3: Custom Domain (선택사항)
1. **Custom domain** 입력 (예: `www.yourdomain.com`)
2. DNS 설정:
   ```
   Type: CNAME
   Name: www
   Value: yourusername.github.io
   ```
3. **Enforce HTTPS** 체크박스 활성화

**장점:**
- ✅ 완전 무료
- ✅ HTTPS 자동 적용
- ✅ CDN 자동 적용
- ✅ Git push만으로 자동 배포

**단점:**
- ❌ 서버 측 코드 실행 불가 (정적 파일만)
- ❌ 환경 변수 사용 제한

---

### 방법 2: Firebase Hosting (권장)

Firebase를 이미 사용 중이므로 가장 적합한 방법입니다.

#### 단계 1: Firebase CLI 설치
```bash
# Node.js 설치 확인
node --version

# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login
```

#### 단계 2: Firebase 초기화
```bash
# 프로젝트 폴더로 이동
cd C:\Users\jjang\Projects\claude_code_test

# Firebase 초기화
firebase init hosting

# 질문에 대한 답변:
# ? Select Firebase project: (기존 프로젝트 선택)
# ? What do you want to use as your public directory? (public 입력 또는 . 입력)
# ? Configure as a single-page app? No
# ? Set up automatic builds with GitHub? No
```

#### 단계 3: firebase.json 수정
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.md",
      "firebase-config.local.js",
      "admin-config.local.js"
    ],
    "rewrites": [
      {
        "source": "/admin",
        "destination": "/admin.html"
      },
      {
        "source": "/lms",
        "destination": "/lms.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

#### 단계 4: 배포
```bash
# 배포
firebase deploy --only hosting

# 배포 완료 후 URL 확인
# Hosting URL: https://your-project.web.app
```

#### 단계 5: Custom Domain (선택사항)
```bash
# Firebase Console → Hosting → Add custom domain
# 안내에 따라 DNS 레코드 추가
```

**장점:**
- ✅ Firebase와 완벽 통합
- ✅ 무료 SSL 인증서
- ✅ 글로벌 CDN
- ✅ 한 줄 명령어로 배포
- ✅ 자동 롤백 기능

**단점:**
- ❌ Firebase CLI 설치 필요

---

### 방법 3: 일반 웹 호스팅 (cPanel, Cafe24, 가비아 등)

#### 단계 1: FTP 접속 정보 확인
```
FTP 주소: ftp.yourdomain.com
사용자명: your_username
비밀번호: your_password
포트: 21
```

#### 단계 2: FileZilla로 업로드

1. **FileZilla 다운로드 및 설치**
   - [https://filezilla-project.org/](https://filezilla-project.org/)

2. **FTP 접속**
   - 호스트: `ftp.yourdomain.com`
   - 사용자명: (제공받은 사용자명)
   - 비밀번호: (제공받은 비밀번호)
   - 포트: `21`

3. **파일 업로드**
   - 왼쪽(로컬): `C:\Users\jjang\Projects\claude_code_test`
   - 오른쪽(서버): `/public_html` 또는 `/www`
   - 모든 파일 드래그하여 업로드

#### 단계 3: 업로드 제외 파일
다음 파일/폴더는 업로드하지 **마세요**:
- `.git/` (Git 폴더)
- `node_modules/` (있는 경우)
- `*.md` (문서 파일)
- `.gitignore`
- `firebase-config.local.js` (로컬 설정)
- `admin-config.local.js` (로컬 설정)

#### 단계 4: 서버에 Firebase 설정 파일 생성

FTP로 서버 접속 후:

1. `firebase-config.local.js` 파일 생성
2. Firebase Console에서 복사한 설정 붙여넣기
3. 파일 권한: `644` (읽기 전용)

**또는 cPanel 파일 관리자 사용:**

1. cPanel 로그인
2. **파일 관리자** 클릭
3. `/public_html` 이동
4. **+ 파일** 클릭
5. `firebase-config.local.js` 생성
6. 편집 버튼 클릭하여 설정 붙여넣기

---

### 방법 4: Netlify (GitHub 연동, 무료)

#### 단계 1: Netlify 계정 생성
1. [https://www.netlify.com/](https://www.netlify.com/) 접속
2. **Sign up** 클릭
3. **GitHub로 로그인** 선택

#### 단계 2: 새 사이트 배포
1. **Add new site** → **Import an existing project** 클릭
2. **GitHub** 선택
3. Repository 선택 (`claude_code_test`)
4. 설정:
   ```
   Build command: (비워두기)
   Publish directory: .
   ```
5. **Deploy site** 클릭

#### 단계 3: 환경 변수 설정
1. **Site settings** → **Environment variables**
2. **Add a variable** 클릭
3. Firebase 설정을 환경 변수로 추가:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   ...
   ```

#### 단계 4: Custom Domain (선택사항)
1. **Domain settings** → **Add custom domain**
2. 도메인 입력 및 DNS 설정

**장점:**
- ✅ GitHub과 자동 연동
- ✅ Git push 시 자동 배포
- ✅ 무료 SSL
- ✅ 무료 CDN
- ✅ 빌드 로그 확인 가능

---

### 방법 5: Vercel (Next.js 최적화, 무료)

#### 단계 1: Vercel 계정 생성
1. [https://vercel.com/](https://vercel.com/) 접속
2. **Sign up** → **GitHub로 로그인**

#### 단계 2: 프로젝트 Import
1. **Add New** → **Project** 클릭
2. GitHub Repository 선택
3. **Import** 클릭
4. 설정:
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: (비워두기)
   Output Directory: ./
   ```
5. **Deploy** 클릭

#### 단계 3: 환경 변수 설정
1. **Settings** → **Environment Variables**
2. Firebase 설정 추가

**장점:**
- ✅ GitHub 자동 연동
- ✅ 무료 SSL
- ✅ 엣지 네트워크
- ✅ 빠른 배포 속도

---

## 3. Firebase 설정

### 배포 서버에서 Firebase 설정

#### 방법 A: 직접 설정 파일 생성 (권장)

1. **서버에 접속** (FTP, SSH, 또는 파일 관리자)

2. **firebase-config.local.js 생성**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890",
     measurementId: "G-XXXXXXXXXX"
   };

   if (typeof firebase !== 'undefined' && !firebase.apps.length) {
       firebase.initializeApp(firebaseConfig);
       console.log('✅ Firebase 초기화 완료 (로컬 설정)');
       window.dispatchEvent(new Event('firebase-ready'));
   }
   ```

3. **파일 권한 설정** (Linux 서버)
   ```bash
   chmod 644 firebase-config.local.js
   ```

#### 방법 B: 환경 변수 사용 (Netlify, Vercel)

1. **빌드 스크립트 생성** (`build.sh`)
   ```bash
   #!/bin/bash
   cat > firebase-config.local.js << EOF
   const firebaseConfig = {
     apiKey: "${FIREBASE_API_KEY}",
     authDomain: "${FIREBASE_AUTH_DOMAIN}",
     projectId: "${FIREBASE_PROJECT_ID}",
     storageBucket: "${FIREBASE_STORAGE_BUCKET}",
     messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
     appId: "${FIREBASE_APP_ID}",
     measurementId: "${FIREBASE_MEASUREMENT_ID}"
   };

   if (typeof firebase !== 'undefined' && !firebase.apps.length) {
       firebase.initializeApp(firebaseConfig);
       window.dispatchEvent(new Event('firebase-ready'));
   }
   EOF
   ```

2. **플랫폼에서 환경 변수 설정**
   - Netlify: Site settings → Environment variables
   - Vercel: Settings → Environment Variables
   - GitHub Pages: Secrets

### Firebase 도메인 승인

1. **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
2. **Add domain** 클릭
3. 배포된 도메인 추가:
   ```
   yourdomain.com
   www.yourdomain.com
   your-project.web.app (Firebase Hosting)
   yourusername.github.io (GitHub Pages)
   your-site.netlify.app (Netlify)
   ```

---

## 4. 관리자 계정 설정

### 운영 환경 권장 방법

#### ⚠️ 중요: `admin-config.local.js` 파일은 서버에 업로드하지 마세요!

운영 환경에서는 **Firebase Authentication만 사용**해야 합니다.

#### 관리자 로그인 방법

1. **Firebase Console에서 관리자 계정 생성** (단계 7 참고)
   ```
   이메일: admin@yourdomain.com
   비밀번호: (강력한 비밀번호)
   ```

2. **Firestore에 관리자 문서 추가**
   - 컬렉션: `admins`
   - 문서 ID: (사용자 UID)
   - 필드: `{ email, role: 'admin', createdAt }`

3. **admin.html에서 Firebase로 로그인**
   - `admin-config.local.js` 없으면 자동으로 Firebase 모드
   - 이메일/비밀번호로 로그인
   - Firestore에서 관리자 역할 확인

---

## 5. 배포 후 확인사항

### ✅ 체크리스트

#### 기본 기능 테스트
- [ ] **메인 페이지** 접속: `https://yourdomain.com/`
- [ ] **LMS 페이지** 접속: `https://yourdomain.com/lms.html`
- [ ] **관리자 페이지** 접속: `https://yourdomain.com/admin.html`

#### Firebase 연결 확인
1. 브라우저 개발자 도구(F12) → Console 탭
2. 다음 메시지 확인:
   ```
   ✅ Firebase 초기화 완료
   ✅ Firebase Authentication 준비 완료
   ✅ Firestore 준비 완료
   ```

#### 사용자 기능 테스트
- [ ] 회원가입 (`lms.html`)
- [ ] 로그인/로그아웃
- [ ] 강좌 목록 조회
- [ ] 강좌 검색/필터
- [ ] 수강신청
- [ ] 내 강좌 조회

#### 관리자 기능 테스트
- [ ] 관리자 로그인 (`admin.html`)
- [ ] 대시보드 통계 조회
- [ ] 강좌 생성/수정/삭제
- [ ] 사용자 목록 조회
- [ ] 수강신청 목록 조회
- [ ] 데이터 내보내기 (CSV)

#### 보안 확인
- [ ] HTTPS 적용 확인 (주소창에 자물쇠 아이콘)
- [ ] Firebase Security Rules 적용 확인
- [ ] Rate Limiting 작동 확인 (5회 로그인 실패 시 차단)
- [ ] XSS 방어 확인 (HTML 이스케이핑)

---

## 6. 문제 해결

### 문제 1: "Firebase is not defined" 오류

**원인:** Firebase SDK가 로드되지 않음

**해결:**
1. 인터넷 연결 확인
2. Firebase SDK CDN 확인:
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
   ```
3. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)

---

### 문제 2: "Permission denied" 오류

**원인:** Firestore Security Rules 설정 오류

**해결:**
1. Firebase Console → Firestore Database → Rules
2. `FIREBASE_SETUP_GUIDE.md`의 보안 규칙 복사
3. **게시** 클릭
4. 5분 후 재시도

---

### 문제 3: 관리자 로그인 실패

**원인:** 관리자 문서가 없거나 UID 불일치

**해결:**
1. Firebase Console → Authentication → Users
2. 관리자 이메일의 **UID** 복사
3. Firestore Database → `admins` 컬렉션
4. UID와 문서 ID가 일치하는지 확인

---

### 문제 4: CORS 오류

**원인:** Firebase 도메인 승인 누락

**해결:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. 배포된 도메인 추가
3. 5분 후 재시도

---

### 문제 5: 이미지/비디오 업로드 실패

**원인:** Storage Security Rules 또는 용량 제한

**해결:**
1. Firebase Console → Storage → Rules
2. `FIREBASE_SETUP_GUIDE.md`의 Storage 규칙 복사
3. 파일 크기 확인:
   - 비디오: 500MB 이하
   - 이미지: 5MB 이하

---

### 문제 6: 한글 깨짐 (CSV 내보내기)

**원인:** UTF-8 인코딩 문제

**해결:**
이미 UTF-8 BOM이 포함되어 있으므로 문제없음.
엑셀에서 파일 열 때 **"텍스트 파일 가져오기"** 사용:
1. 데이터 → 텍스트/CSV에서 가져오기
2. 파일 형식: UTF-8
3. 구분 기호: 쉼표

---

## 📚 배포 체크리스트 요약

### 배포 전
- [ ] Firebase 프로젝트 설정 완료
- [ ] `firebase-config.local.js` 준비
- [ ] 관리자 계정 생성
- [ ] 보안 규칙 설정
- [ ] 로컬 테스트 완료

### 배포 중
- [ ] 파일 업로드 (FTP, Git push, 또는 Firebase deploy)
- [ ] Firebase 설정 파일 생성
- [ ] 도메인 승인 추가
- [ ] HTTPS 설정

### 배포 후
- [ ] 모든 페이지 접속 확인
- [ ] Firebase 연결 확인
- [ ] 사용자 기능 테스트
- [ ] 관리자 기능 테스트
- [ ] 보안 확인

---

## 🎉 완료!

축하합니다! 웹 애플리케이션이 성공적으로 배포되었습니다.

### 다음 단계

1. **모니터링 설정**
   - Firebase Analytics 확인
   - 오류 로그 모니터링

2. **성능 최적화**
   - 이미지 압축
   - JavaScript 파일 최소화
   - CDN 활용

3. **사용자 지원**
   - 문의 채널 운영
   - FAQ 페이지 작성

---

**작성일:** 2025-10-02
**버전:** 1.0.0
