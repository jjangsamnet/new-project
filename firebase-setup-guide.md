# 🔥 Firebase 완전 설정 가이드

## 1. Firebase Console 접속 및 확인

### 📋 기본 정보
- **프로젝트 ID**: `lms-26168`
- **앱 ID**: `1:264403082469:web:74f35eaec8e2c2f322080c`
- **Console URL**: https://console.firebase.google.com/project/lms-26168

---

## 2. 🔐 Firebase Authentication 설정

### 2.1 Authentication 활성화
1. Firebase Console → **Authentication** 클릭
2. **시작하기** 버튼 클릭 (처음인 경우)
3. **Sign-in method** 탭으로 이동

### 2.2 이메일/비밀번호 로그인 활성화
1. **Email/Password** 클릭
2. **사용 설정** 토글을 **ON**으로 변경
3. **저장** 버튼 클릭

### 2.3 승인된 도메인 추가 (필요한 경우)
1. **Settings** 탭 → **Authorized domains**
2. 로컬 테스트용: `localhost` (이미 추가되어 있음)
3. 배포용 도메인이 있다면 추가

---

## 3. 🗄️ Firestore Database 설정

### 3.1 Firestore 활성화
1. Firebase Console → **Firestore Database** 클릭
2. **데이터베이스 만들기** 버튼 클릭
3. **프로덕션 모드로 시작** 또는 **테스트 모드로 시작** 선택
   - **테스트 모드**: 30일간 모든 읽기/쓰기 허용 (개발용)
   - **프로덕션 모드**: 보안 규칙 수동 설정 필요
4. **위치 선택**: `asia-northeast1 (Tokyo)` 또는 `asia-southeast1 (Singapore)` 권장

### 3.2 Firestore 보안 규칙 설정
1. **규칙** 탭으로 이동
2. 다음 규칙을 입력:

#### 개발/테스트용 규칙 (관대한 설정)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 읽기/쓰기 허용 (테스트용)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**중요**: 설정 저장 문제가 있다면 위의 테스트용 규칙을 먼저 적용해보세요.

#### 프로덕션용 규칙 (보안 강화)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서 - 인증된 사용자만 접근
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 강좌 문서 - 모든 사용자 읽기, 인증된 사용자만 쓰기
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 수강신청 문서 - 인증된 사용자만 접근
    match /enrollments/{enrollmentId} {
      allow read, write: if request.auth != null;
    }

    // 설정 문서 - 모든 접근 허용 (관리자 기능)
    match /settings/{settingId} {
      allow read, write: if true;
    }

    // 연결 테스트 문서 - 모든 접근 허용
    match /connection-test/{testId} {
      allow read, write: if true;
    }
  }
}
```

3. **게시** 버튼 클릭
4. **규칙이 적용될 때까지 1-2분 대기**

---

## 4. 🧪 연결 테스트

### 4.1 빠른 테스트
1. `firebase-connection-test.html` 파일 열기
2. **빠른 연결 테스트** 버튼 클릭
3. 모든 상태 카드가 녹색(성공)인지 확인

### 4.2 개별 테스트
- **Firestore 연결 테스트**: 데이터베이스 연결 확인
- **Auth 연결 테스트**: 인증 서비스 확인
- **회원가입 테스트**: 새 계정 생성 테스트
- **로그인 테스트**: 기존 계정 로그인 테스트

### 4.3 LMS 시스템 테스트
1. `lms.html` 페이지 열기
2. 개발자 도구(F12) → Console
3. `lmsDebug.getFirebaseReady()` 입력
4. `true` 반환되면 Firebase 연결 성공
5. 회원가입/로그인 시 `(Firebase)` 표시 확인

---

## 5. 🚨 문제 해결

### 5.1 Firestore 권한 오류
**오류**: `permission-denied` 또는 `PERMISSION_DENIED`
**해결책**:
1. Firestore 규칙에서 테스트용 규칙 적용
2. 규칙 적용 후 1-2분 대기
3. 브라우저 새로고침

### 5.2 Auth 도메인 오류
**오류**: `auth/unauthorized-domain`
**해결책**:
1. Authentication → Settings → Authorized domains
2. 현재 도메인 추가 (예: `localhost`, `127.0.0.1`)

### 5.3 네트워크 연결 오류
**오류**: `NETWORK_ERROR` 또는 연결 시간 초과
**해결책**:
1. 인터넷 연결 확인
2. 방화벽/보안 프로그램 확인
3. VPN 사용 중이면 잠시 해제

---

## 6. ✅ 설정 완료 체크리스트

- [ ] Firebase Authentication 활성화
- [ ] Email/Password 로그인 방법 활성화
- [ ] Firestore Database 생성
- [ ] Firestore 보안 규칙 설정
- [ ] `firebase-connection-test.html` 테스트 통과
- [ ] LMS 시스템에서 `(Firebase)` 로그인 확인
- [ ] 다른 디바이스에서 동일 계정 로그인 테스트

---

## 7. 📞 추가 지원

문제가 계속 발생하면:
1. `firebase-debug.html` 실행하여 상세 진단
2. 브라우저 콘솔의 오류 메시지 확인
3. Firebase Console의 사용량 및 할당량 확인