# FTP 서버 배포 가이드

GitHub에서 FTP 서버로 파일을 업로드하는 상세 가이드입니다.

---

## 📋 목차

1. [FTP 접속 정보 확인](#1-ftp-접속-정보-확인)
2. [FileZilla 설치 및 설정](#2-filezilla-설치-및-설정)
3. [업로드할 파일 준비](#3-업로드할-파일-준비)
4. [FTP로 파일 업로드](#4-ftp로-파일-업로드)
5. [Firebase 설정 파일 생성](#5-firebase-설정-파일-생성)
6. [배포 후 확인](#6-배포-후-확인)
7. [문제 해결](#7-문제-해결)

---

## 1. FTP 접속 정보 확인

### 호스팅 업체에서 제공받은 정보

FTP 접속에 필요한 정보:

```
FTP 주소 (Host): ftp.yourdomain.com 또는 123.123.123.123
사용자명 (Username): your_ftp_username
비밀번호 (Password): your_ftp_password
포트 (Port): 21 (일반 FTP) 또는 22 (SFTP)
```

### 호스팅 업체별 FTP 정보 확인 방법

#### Cafe24
1. Cafe24 호스팅 관리 페이지 로그인
2. **나의 서비스 관리** → **호스팅 관리**
3. **FTP 계정** 메뉴 확인

#### 가비아
1. 가비아 My가비아 로그인
2. **서비스 관리** → **웹 호스팅**
3. **FTP 접속정보** 확인

#### 호스팅케이알
1. 호스팅케이알 관리자 페이지
2. **FTP 관리** 메뉴
3. 접속 정보 확인

---

## 2. FileZilla 설치 및 설정

### 단계 2-1: FileZilla 다운로드

1. FileZilla 공식 사이트 접속: [https://filezilla-project.org/](https://filezilla-project.org/)
2. **Download FileZilla Client** 클릭
3. Windows 버전 다운로드
4. 설치 파일 실행 및 설치

### 단계 2-2: FileZilla 실행 및 연결

1. **FileZilla 실행**

2. **빠른 연결**
   - 상단 메뉴바의 빠른 연결 입력창에 정보 입력:
   ```
   호스트(H): ftp.yourdomain.com
   사용자명(U): your_username
   비밀번호(W): your_password
   포트(P): 21
   ```
   - **빠른 연결** 버튼 클릭

3. **인증서 확인** (FTPS 사용 시)
   - "알 수 없는 인증서" 경고 표시되면
   - **확인** 체크
   - **확인** 버튼 클릭

### 단계 2-3: 사이트 관리자에 저장 (선택사항)

매번 입력하기 번거로우면 사이트 관리자에 저장:

1. **파일** → **사이트 관리자** (Ctrl+S)
2. **새 사이트** 클릭
3. 사이트 이름 입력 (예: "게임리터러시 서버")
4. 정보 입력:
   ```
   프로토콜: FTP - 파일 전송 프로토콜
   호스트: ftp.yourdomain.com
   포트: 21
   암호화: 명시적 FTP over TLS 사용 (권장)
   로그온 유형: 일반
   사용자: your_username
   비밀번호: your_password
   ```
5. **연결** 클릭

---

## 3. 업로드할 파일 준비

### 업로드 필수 파일 목록

✅ **반드시 업로드해야 하는 파일:**

```
📁 프로젝트 루트
├── index.html ✅
├── lms.html ✅
├── admin.html ✅
├── firebase-test.html ✅
├── script.js ✅
├── lms-script.js ✅
├── admin-script.js ✅
├── styles.css ✅
├── lms-styles.css ✅
├── admin-styles.css ✅
├── firebase-config.js ✅
├── firebase-service.js ✅
├── firebase-app-check.js ✅
├── rate-limiter.js ✅
├── crypto-utils.js ✅
├── error-handler.js ✅
├── validation-utils.js ✅
├── url-sanitizer.js ✅
├── file-validator.js ✅
├── loading-indicator.js ✅
└── admin-config.example.js ✅
```

### ❌ 업로드하지 말아야 할 파일

```
.git/ (Git 폴더 전체)
.gitignore
*.md (문서 파일들)
node_modules/ (있다면)
package.json (있다면)
package-lock.json (있다면)
firebase-config.local.js (로컬 설정 - 보안상 업로드 금지!)
admin-config.local.js (로컬 설정 - 보안상 업로드 금지!)
```

⚠️ **중요:** `firebase-config.local.js`와 `admin-config.local.js`는 절대 업로드하지 마세요!
이 파일들은 서버에서 직접 생성해야 합니다.

---

## 4. FTP로 파일 업로드

### 단계 4-1: 서버 디렉토리 확인

FileZilla 연결 후 오른쪽 패널(원격 사이트)에서 웹 루트 디렉토리 찾기:

일반적인 웹 루트 디렉토리:
- `/public_html`
- `/www`
- `/htdocs`
- `/web`
- `/html`

### 단계 4-2: 파일 선택 및 업로드

1. **왼쪽 패널** (로컬 사이트)
   - `C:\Users\jjang\Projects\claude_code_test` 폴더 열기

2. **오른쪽 패널** (원격 사이트)
   - `/public_html` 또는 웹 루트 디렉토리로 이동

3. **파일 선택**
   - 왼쪽에서 업로드할 파일 선택
   - Ctrl+클릭으로 여러 파일 선택 가능

4. **업로드 방법**

   **방법 1: 드래그 앤 드롭**
   - 왼쪽 파일을 오른쪽으로 드래그

   **방법 2: 우클릭 메뉴**
   - 파일 우클릭 → **업로드**

   **방법 3: 전체 선택**
   - 왼쪽에서 Ctrl+A (전체 선택)
   - 업로드하지 말아야 할 파일은 Ctrl+클릭으로 선택 해제
   - 오른쪽으로 드래그

### 단계 4-3: 업로드 진행 확인

- 하단의 **전송 대기열** 탭에서 진행 상황 확인
- **성공한 전송** 탭에서 업로드 완료 파일 확인
- **실패한 전송** 탭에서 오류 확인

### 단계 4-4: 권한 설정 (Linux 서버만)

업로드 후 파일 권한 설정 (필요한 경우):

1. 오른쪽 패널에서 파일 우클릭
2. **파일 권한** 선택
3. 권장 설정:
   ```
   HTML, JS, CSS 파일: 644 (rw-r--r--)
   디렉토리: 755 (rwxr-xr-x)
   ```

---

## 5. Firebase 설정 파일 생성

⚠️ **매우 중요:** 이 단계를 반드시 수행해야 웹사이트가 작동합니다!

### 방법 1: FileZilla로 파일 생성 (권장)

#### 단계 5-1: firebase-config.local.js 생성

1. **FileZilla 오른쪽 패널**에서 웹 루트 디렉토리 선택
2. 우클릭 → **파일 만들기**
3. 파일 이름: `firebase-config.local.js`
4. 생성된 파일 우클릭 → **보기/편집**
5. 메모장이나 편집기에서 아래 내용 붙여넣기:

```javascript
// Firebase 설정 (운영 환경)
const firebaseConfig = {
  apiKey: "여기에-Firebase-Console에서-복사한-API-Key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};

// Firebase 초기화
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase 초기화 완료 (운영 서버)');
    window.dispatchEvent(new Event('firebase-ready'));
}
```

6. **저장** (Ctrl+S)
7. 편집기 닫기
8. FileZilla에서 **예** 클릭 (서버에 업로드)

#### Firebase 설정 정보를 어디서 가져오나요?

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **프로젝트 설정** (톱니바퀴 아이콘) 클릭
4. **일반** 탭 → **내 앱** 섹션
5. **웹 앱** 선택
6. **SDK 설정 및 구성** → **구성** 선택
7. `firebaseConfig` 객체 복사
8. 위 파일에 붙여넣기

### 방법 2: cPanel 파일 관리자 사용

호스팅에 cPanel이 있는 경우:

1. **cPanel 로그인**
2. **파일 관리자** 클릭
3. `/public_html` 이동
4. **+ 파일** 클릭
5. 파일 이름: `firebase-config.local.js`
6. **Create New File** 클릭
7. 파일 우클릭 → **편집**
8. 위의 설정 코드 붙여넣기
9. **저장** 클릭

### 방법 3: 로컬에서 생성 후 업로드

1. 로컬 PC에서 `firebase-config.local.js` 생성
2. Firebase 설정 입력
3. FileZilla로 업로드
4. ⚠️ **주의:** `.gitignore`에 있어서 Git에 커밋되지 않으므로 별도 보관 필요

---

## 6. 배포 후 확인

### 단계 6-1: 웹사이트 접속

1. 브라우저에서 도메인 접속
   ```
   https://yourdomain.com
   또는
   https://yourdomain.com/index.html
   ```

2. 각 페이지 접속 확인:
   - 메인 페이지: `https://yourdomain.com/`
   - LMS: `https://yourdomain.com/lms.html`
   - 관리자: `https://yourdomain.com/admin.html`

### 단계 6-2: Firebase 연결 확인

1. **브라우저 개발자 도구** 열기 (F12)
2. **Console** 탭 선택
3. 다음 메시지 확인:
   ```
   ✅ Firebase 초기화 완료 (운영 서버)
   ✅ Firebase Authentication 준비 완료
   ✅ Firestore 준비 완료
   ✅ Firebase Storage 준비 완료
   ```

### 단계 6-3: 기능 테스트

#### LMS 사용자 기능
- [ ] 회원가입
- [ ] 로그인
- [ ] 강좌 목록 조회
- [ ] 강좌 검색
- [ ] 수강신청
- [ ] 내 강좌 조회

#### 관리자 기능
- [ ] 관리자 로그인 (Firebase 계정)
- [ ] 대시보드 조회
- [ ] 강좌 생성
- [ ] 사용자 목록 조회

---

## 7. 문제 해결

### 문제 1: FTP 연결 실패

**증상:**
```
오류: 호스트에 연결할 수 없음
오류: 연결 시간 초과
```

**해결 방법:**

1. **FTP 정보 재확인**
   - 호스트 주소가 정확한지 확인
   - 포트 번호 확인 (일반 FTP: 21, SFTP: 22)

2. **방화벽 확인**
   - Windows 방화벽에서 FileZilla 허용
   - 바이러스 백신 일시 중지 후 재시도

3. **Passive 모드 변경**
   - FileZilla: **편집** → **설정** → **연결** → **FTP**
   - **수동 모드 사용** 체크 또는 해제

4. **포트 변경**
   - 일반 FTP: 21
   - FTPS: 990
   - SFTP: 22

---

### 문제 2: 파일 업로드 실패

**증상:**
```
오류: 파일 전송 실패
오류: 권한 거부
```

**해결 방법:**

1. **디스크 용량 확인**
   - 호스팅 용량이 남아있는지 확인

2. **권한 확인**
   - 상위 디렉토리 권한 755 설정
   - 파일 권한 644 설정

3. **파일명 확인**
   - 한글 파일명 → 영문으로 변경
   - 공백 → 언더스코어(_)로 변경

4. **ASCII vs Binary 모드**
   - FileZilla: **전송** → **전송 종류**
   - HTML, JS, CSS: **ASCII 모드**
   - 이미지, 비디오: **Binary 모드**
   - 권장: **자동** 선택

---

### 문제 3: "Firebase is not defined" 오류

**증상:**
브라우저 콘솔에 `Firebase is not defined` 오류

**해결 방법:**

1. **firebase-config.local.js 파일 확인**
   ```bash
   # FTP에서 확인
   /public_html/firebase-config.local.js 존재 확인
   ```

2. **파일 내용 확인**
   - API Key가 올바르게 입력되었는지 확인
   - 따옴표, 쉼표 등 문법 오류 확인

3. **파일 로드 순서 확인**
   - HTML에서 Firebase SDK가 먼저 로드되는지 확인
   - `firebase-config.local.js`가 그 다음 로드되는지 확인

---

### 문제 4: 페이지가 표시되지 않음 (404 오류)

**증상:**
```
404 Not Found
페이지를 찾을 수 없습니다
```

**해결 방법:**

1. **파일 위치 확인**
   - 파일이 웹 루트 디렉토리에 있는지 확인
   - `/public_html/index.html` (O)
   - `/index.html` (X)

2. **파일명 확인**
   - 대소문자 구분: `Index.html` ≠ `index.html`
   - 확장자 확인: `.html` (O) `.htm` (?)

3. **디렉토리 인덱스 설정**
   - `.htaccess` 파일 생성 (Apache 서버)
   ```apache
   DirectoryIndex index.html index.htm
   ```

---

### 문제 5: CSS/JavaScript가 적용되지 않음

**증상:**
- 페이지는 보이지만 스타일이 없음
- 기능이 작동하지 않음

**해결 방법:**

1. **파일 경로 확인**
   - HTML에서 상대 경로 사용 확인
   - `<link rel="stylesheet" href="styles.css">` (O)
   - `<link rel="stylesheet" href="/styles.css">` (루트 기준)

2. **파일 업로드 확인**
   - CSS, JS 파일이 모두 업로드되었는지 확인

3. **브라우저 캐시 삭제**
   - Ctrl + Shift + Delete
   - 캐시 삭제 후 새로고침 (Ctrl + F5)

4. **MIME 타입 확인** (서버 설정)
   - `.htaccess`에 추가:
   ```apache
   AddType text/css .css
   AddType application/javascript .js
   ```

---

### 문제 6: 한글이 깨져서 보임

**증상:**
- 한글이 ??? 또는 □□□로 표시
- 이상한 문자로 표시

**해결 방법:**

1. **파일 인코딩 확인**
   - 모든 HTML, JS 파일이 UTF-8로 저장되었는지 확인
   - 메모장 → **다른 이름으로 저장** → 인코딩: **UTF-8**

2. **HTML meta 태그 확인**
   ```html
   <meta charset="UTF-8">
   ```

3. **.htaccess 설정** (Apache 서버)
   ```apache
   AddDefaultCharset UTF-8
   ```

---

## 📋 배포 체크리스트

### 배포 전
- [ ] FTP 접속 정보 확인
- [ ] FileZilla 설치 완료
- [ ] 업로드할 파일 목록 확인
- [ ] Firebase 설정 정보 준비

### 배포 중
- [ ] FTP 서버 연결 성공
- [ ] 모든 필수 파일 업로드
- [ ] firebase-config.local.js 생성
- [ ] 파일 권한 설정 (Linux)

### 배포 후
- [ ] 웹사이트 접속 확인
- [ ] Firebase 연결 확인
- [ ] 회원가입/로그인 테스트
- [ ] 강좌 조회 테스트
- [ ] 관리자 기능 테스트

---

## 🎯 빠른 참조

### FileZilla 단축키
- **Ctrl+S**: 사이트 관리자
- **Ctrl+Q**: 빠른 연결 표시/숨김
- **Ctrl+R**: 새로고침
- **F5**: 선택한 파일 다시 로드

### 일반적인 웹 루트 디렉토리
- Apache: `/var/www/html` 또는 `/public_html`
- Nginx: `/usr/share/nginx/html` 또는 `/var/www`
- Windows IIS: `C:\inetpub\wwwroot`

### 필수 파일 권한 (Linux)
```
디렉토리: 755 (drwxr-xr-x)
HTML/JS/CSS: 644 (-rw-r--r--)
이미지: 644 (-rw-r--r--)
```

---

## 🎉 완료!

FTP로 배포가 완료되었습니다!

### 다음 단계

1. **HTTPS 설정**
   - 호스팅 업체에 SSL 인증서 요청
   - Let's Encrypt 무료 인증서 설치

2. **도메인 연결**
   - DNS 설정
   - A 레코드 또는 CNAME 추가

3. **성능 최적화**
   - Gzip 압축 활성화
   - 브라우저 캐싱 설정
   - 이미지 최적화

---

**작성일:** 2025-10-02
**버전:** 1.0.0

## 💡 추가 도움이 필요하신가요?

문제가 계속되면:
1. 브라우저 콘솔(F12) 오류 메시지 확인
2. FileZilla 로그 확인 (**보기** → **메시지 로그**)
3. 호스팅 업체 고객센터 문의
