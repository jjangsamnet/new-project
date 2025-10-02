# Firebase 설정 가이드

이 가이드는 웹 애플리케이션에 Firebase를 설정하는 전체 과정을 단계별로 설명합니다.

---

## 📋 목차

1. [Firebase 프로젝트 생성](#1-firebase-프로젝트-생성)
2. [Firebase 설정 파일 생성](#2-firebase-설정-파일-생성)
3. [Firebase Authentication 설정](#3-firebase-authentication-설정)
4. [Firestore Database 설정](#4-firestore-database-설정)
5. [Firebase Storage 설정](#5-firebase-storage-설정)
6. [Firebase App Check 설정](#6-firebase-app-check-설정)
7. [관리자 계정 생성](#7-관리자-계정-생성)
8. [테스트 및 검증](#8-테스트-및-검증)

---

## 1. Firebase 프로젝트 생성

### 단계 1-1: Firebase Console 접속

1. 웹 브라우저에서 [Firebase Console](https://console.firebase.google.com/) 접속
2. Google 계정으로 로그인

### 단계 1-2: 새 프로젝트 생성

1. **"프로젝트 추가"** 버튼 클릭
2. 프로젝트 이름 입력 (예: `eduplatform` 또는 `게임리터러시`)
3. **"계속"** 클릭
4. Google Analytics 설정 (선택사항)
   - 권장: **활성화** (사용자 분석에 유용)
   - 계정 선택 또는 새로 만들기
5. **"프로젝트 만들기"** 클릭
6. 프로젝트 생성 완료까지 대기 (약 30초~1분)

### 단계 1-3: 웹 앱 추가

1. 프로젝트 개요 페이지에서 **웹 아이콘(</>)** 클릭
2. 앱 닉네임 입력 (예: `EduPlatform Web`)
3. **"Firebase Hosting도 설정" 체크박스** (선택사항)
   - 나중에 설정 가능하므로 체크 해제 가능
4. **"앱 등록"** 클릭

---

## 2. Firebase 설정 파일 생성

### 단계 2-1: Firebase 구성 정보 복사

앱 등록 후 표시되는 코드에서 `firebaseConfig` 객체 복사:

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
```

### 단계 2-2: firebase-config.local.js 생성

1. 프로젝트 폴더에서 `firebase-config.example.js` 파일을 복사
2. `firebase-config.local.js`로 이름 변경
3. 파일 열기 및 수정:

```javascript
// firebase-config.local.js
const firebaseConfig = {
  apiKey: "여기에-실제-API-Key-붙여넣기",
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
    console.log('✅ Firebase 초기화 완료 (로컬 설정)');

    // Firebase가 준비되었음을 알림
    window.dispatchEvent(new Event('firebase-ready'));
}
```

4. 파일 저장

⚠️ **중요:** 이 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

---

## 3. Firebase Authentication 설정

### 단계 3-1: Authentication 활성화

1. Firebase Console 왼쪽 메뉴에서 **"Authentication"** 클릭
2. **"시작하기"** 버튼 클릭

### 단계 3-2: 이메일/비밀번호 인증 활성화

1. **"Sign-in method"** 탭 클릭
2. **"이메일/비밀번호"** 행 클릭
3. **"사용 설정"** 토글 ON
4. **"저장"** 클릭

### 단계 3-3: 승인된 도메인 추가

1. **"Settings"** (톱니바퀴) → **"승인된 도메인"** 탭
2. 기본적으로 `localhost`와 `*.firebaseapp.com` 추가됨
3. 배포할 도메인 추가 (예: `yourdomain.com`, `*.github.io`)
   - **"도메인 추가"** 클릭
   - 도메인 입력
   - **"추가"** 클릭

### 단계 3-4: 비밀번호 정책 설정 (선택사항)

1. **"Settings"** → **"Password policy"**
2. 권장 설정:
   - 최소 길이: **8자 이상**
   - 대소문자, 숫자, 특수문자 요구사항 설정

---

## 4. Firestore Database 설정

### 단계 4-1: Firestore 생성

1. Firebase Console 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. **모드 선택:**
   - **프로덕션 모드** 선택 (보안 규칙을 직접 설정)
   - 테스트 모드는 30일 후 자동으로 쓰기 차단됨
4. **"다음"** 클릭

### 단계 4-2: 위치 선택

1. **Cloud Firestore 위치** 선택
   - 권장: **asia-northeast3 (서울)** 또는 **asia-northeast1 (도쿄)**
   - 한국 사용자 대상이면 서울 선택
2. **"사용 설정"** 클릭
3. 데이터베이스 생성 완료 대기 (약 1~2분)

### 단계 4-3: Firestore Security Rules 설정

1. **"규칙"** 탭 클릭
2. 기존 규칙 삭제 후 아래 규칙 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== 관리자 컬렉션 =====
    match /admins/{adminId} {
      // 인증된 사용자만 읽기 가능 (자신이 관리자인지 확인용)
      allow read: if request.auth != null;
      // 쓰기는 불가 (Firebase Console에서 수동 관리)
      allow write: if false;
    }

    // ===== 사용자 컬렉션 =====
    match /users/{userId} {
      // 인증된 사용자는 모든 사용자 정보 읽기 가능
      allow read: if request.auth != null;

      // 회원가입 시 생성 가능
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.id;

      // 본인 정보만 수정 가능
      allow update: if request.auth != null &&
                       request.auth.uid == userId;

      // 삭제 불가
      allow delete: if false;
    }

    // ===== 강좌 컬렉션 =====
    match /courses/{courseId} {
      // 모든 사용자가 강좌 목록 조회 가능 (로그인 불필요)
      allow read: if true;

      // 관리자만 강좌 생성/수정/삭제 가능
      allow write: if request.auth != null &&
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // ===== 수강신청 컬렉션 =====
    match /enrollments/{enrollmentId} {
      // 본인 수강신청 또는 관리자만 읽기 가능
      allow read: if request.auth != null &&
                     (request.auth.uid == resource.data.userId ||
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid)));

      // 본인만 수강신청 생성 가능
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.userId &&
                       // 중복 수강신청 방지는 클라이언트 측 Transaction에서 처리
                       request.resource.data.userId is string &&
                       request.resource.data.courseId is number;

      // 본인 또는 관리자만 수정 가능
      allow update: if request.auth != null &&
                       (request.auth.uid == resource.data.userId ||
                        exists(/databases/$(database)/documents/admins/$(request.auth.uid)));

      // 관리자만 삭제 가능
      allow delete: if request.auth != null &&
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // ===== 설정 컬렉션 =====
    match /settings/{settingId} {
      // 모든 사용자가 설정 읽기 가능
      allow read: if true;

      // 관리자만 설정 변경 가능
      allow write: if request.auth != null &&
                      exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

3. **"게시"** 클릭

### 단계 4-4: 색인(Index) 생성 (필요 시)

복합 쿼리 사용 시 Firestore가 자동으로 색인 생성을 요청합니다.
에러 메시지에 포함된 링크를 클릭하면 자동으로 색인이 생성됩니다.

---

## 5. Firebase Storage 설정

### 단계 5-1: Storage 활성화

1. Firebase Console 왼쪽 메뉴에서 **"Storage"** 클릭
2. **"시작하기"** 클릭
3. **"프로덕션 모드에서 시작"** 선택
4. **"다음"** 클릭

### 단계 5-2: 위치 선택

1. Firestore와 동일한 위치 선택 (예: **asia-northeast3**)
2. **"완료"** 클릭

### 단계 5-3: Storage Security Rules 설정

1. **"Rules"** 탭 클릭
2. 기존 규칙 삭제 후 아래 규칙 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // 강좌 비디오 및 썸네일
    match /courses/{courseId}/{allPaths=**} {
      // 모든 사용자가 읽기 가능
      allow read: if true;

      // 관리자만 업로드 가능
      allow write: if request.auth != null &&
                      firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid)) &&
                      request.resource.size < 500 * 1024 * 1024 && // 500MB 제한
                      request.resource.contentType.matches('video/.*|image/.*');
    }

    // 사용자 프로필 이미지
    match /users/{userId}/{allPaths=**} {
      // 본인 또는 인증된 사용자만 읽기 가능
      allow read: if request.auth != null;

      // 본인만 업로드 가능
      allow write: if request.auth != null &&
                      request.auth.uid == userId &&
                      request.resource.size < 5 * 1024 * 1024 && // 5MB 제한
                      request.resource.contentType.matches('image/.*');
    }
  }
}
```

3. **"게시"** 클릭

---

## 6. Firebase App Check 설정

### 단계 6-1: reCAPTCHA v3 사이트 키 생성

1. [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) 접속
2. **"라벨"** 입력 (예: `EduPlatform`)
3. **reCAPTCHA 유형:** **reCAPTCHA v3** 선택
4. **도메인** 추가:
   - `localhost` (개발용)
   - `yourdomain.com` (프로덕션)
5. **"제출"** 클릭
6. **사이트 키** 복사 (공개 키)

### 단계 6-2: Firebase App Check 설정

1. Firebase Console 왼쪽 메뉴에서 **"App Check"** 클릭
2. **"시작하기"** 클릭
3. 웹 앱 선택
4. **"reCAPTCHA v3"** 선택
5. **사이트 키** 붙여넣기 (단계 6-1에서 복사한 키)
6. **"저장"** 클릭

### 단계 6-3: 코드에 reCAPTCHA 사이트 키 추가

1. `firebase-app-check.js` 파일 열기
2. 28번째 줄 수정:

```javascript
// 수정 전
'YOUR_RECAPTCHA_V3_SITE_KEY',

// 수정 후
'6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // 실제 사이트 키 붙여넣기
```

3. 파일 저장

### 단계 6-4: App Check 강제 적용 (선택사항)

1. Firebase Console → **App Check** → **APIs** 탭
2. 보호할 서비스 선택 (Firestore, Storage 등)
3. **"적용"** 버튼 클릭

⚠️ **주의:** 개발 중에는 적용하지 말고, 프로덕션 배포 전에 활성화하세요.

---

## 7. 관리자 계정 생성

### 방법 1: Firebase Console에서 수동 생성 (권장)

#### 단계 7-1: Authentication에서 사용자 추가

1. Firebase Console → **Authentication** → **Users** 탭
2. **"사용자 추가"** 클릭
3. 정보 입력:
   - **이메일:** `admin@yourdomain.com`
   - **비밀번호:** 강력한 비밀번호 (8자 이상, 대소문자+숫자+특수문자)
4. **"사용자 추가"** 클릭
5. 생성된 사용자의 **UID** 복사 (예: `AbCdEfGh1234567890`)

#### 단계 7-2: Firestore에 관리자 문서 추가

1. Firebase Console → **Firestore Database** → **데이터** 탭
2. **"컬렉션 시작"** 클릭
3. **컬렉션 ID:** `admins` 입력
4. **"다음"** 클릭
5. **문서 ID:** 단계 7-1에서 복사한 UID 붙여넣기
6. 필드 추가:
   - **필드 이름:** `email`, **값:** `admin@yourdomain.com`, **타입:** string
   - **필드 이름:** `role`, **값:** `admin`, **타입:** string
   - **필드 이름:** `createdAt`, **값:** (현재 시간), **타입:** timestamp
7. **"저장"** 클릭

### 방법 2: Firebase Admin SDK 사용 (고급)

Node.js 환경에서 스크립트 실행:

```javascript
// create-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin(email, password) {
  try {
    // 1. Authentication에 사용자 생성
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });

    console.log('✅ 사용자 생성 완료:', userRecord.uid);

    // 2. Firestore에 관리자 문서 추가
    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      email: email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ 관리자 권한 부여 완료');
    console.log('관리자 UID:', userRecord.uid);

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

// 실행
createAdmin('admin@yourdomain.com', 'YourSecurePassword123!')
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

실행:
```bash
npm install firebase-admin
node create-admin.js
```

---

## 8. 테스트 및 검증

### 단계 8-1: Firebase 연결 테스트

1. 프로젝트 폴더에서 `firebase-test.html` 열기
2. 브라우저 개발자 도구(F12) → **Console** 탭 확인
3. 다음 메시지 확인:
   ```
   ✅ Firebase 초기화 완료
   ✅ Firebase Authentication 준비 완료
   ✅ Firestore 준비 완료
   ✅ Firebase Storage 준비 완료
   ```

### 단계 8-2: 관리자 로그인 테스트

1. `admin.html` 열기
2. 단계 7에서 생성한 관리자 계정으로 로그인
   - 이메일: `admin@yourdomain.com`
   - 비밀번호: (설정한 비밀번호)
3. 로그인 성공 시 대시보드 표시 확인

### 단계 8-3: LMS 사용자 가입/로그인 테스트

1. `lms.html` 열기
2. **"회원가입"** 클릭
3. 정보 입력 후 가입
4. 로그인 테스트
5. 강좌 수강신청 테스트

### 단계 8-4: Firestore 데이터 확인

1. Firebase Console → **Firestore Database**
2. 생성된 컬렉션 확인:
   - `users` (사용자 정보)
   - `courses` (강좌)
   - `enrollments` (수강신청)
   - `admins` (관리자)

---

## 🎉 완료!

이제 Firebase가 완전히 설정되었습니다.

### ✅ 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] `firebase-config.local.js` 파일 생성 및 설정
- [ ] Authentication 활성화
- [ ] Firestore Database 생성 및 보안 규칙 설정
- [ ] Storage 활성화 및 보안 규칙 설정
- [ ] App Check 설정 (reCAPTCHA v3)
- [ ] 관리자 계정 생성
- [ ] 연결 테스트 완료

### 📚 추가 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 보안 규칙 가이드](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication 가이드](https://firebase.google.com/docs/auth/web/start)

### 🔧 문제 해결

**Q: "Permission denied" 오류가 발생합니다.**
A: Firestore Security Rules를 확인하세요. 단계 4-3의 규칙이 올바르게 적용되었는지 확인합니다.

**Q: 관리자 로그인이 안 됩니다.**
A:
1. `admins` 컬렉션에 사용자 UID가 있는지 확인
2. Authentication에 사용자가 생성되어 있는지 확인
3. 브라우저 콘솔에서 오류 메시지 확인

**Q: Firebase 초기화가 안 됩니다.**
A:
1. `firebase-config.local.js` 파일이 존재하는지 확인
2. API 키가 올바른지 확인
3. 브라우저 콘솔에서 오류 메시지 확인

**Q: App Check 토큰 오류가 발생합니다.**
A:
1. reCAPTCHA 사이트 키가 올바른지 확인
2. 도메인이 reCAPTCHA에 등록되어 있는지 확인
3. App Check를 임시로 비활성화하고 테스트

---

**작성일:** 2025-10-02
**버전:** 1.0.0
