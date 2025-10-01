# Firebase 보안 규칙 설정 가이드

## 개요

이 문서는 LMS 애플리케이션의 Firebase Firestore 보안 규칙을 설정하는 방법을 안내합니다.

## 보안 규칙 배포

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인

```bash
firebase login
```

### 3. Firebase 프로젝트 초기화

```bash
firebase init firestore
```

- "Firestore Rules"를 선택
- 기존 `firestore.rules` 파일 사용

### 4. 보안 규칙 배포

```bash
firebase deploy --only firestore:rules
```

---

## 보안 규칙 설명

### 주요 보안 원칙

1. **인증 필수**: 모든 데이터 접근은 Firebase Authentication이 필요합니다
2. **최소 권한 원칙**: 사용자는 자신의 데이터만 접근 가능
3. **관리자 권한**: 관리 작업은 별도 관리자 권한 필요
4. **데이터 무결성**: 특정 필드만 수정 가능하도록 제한

---

## 컬렉션별 규칙

### Users 컬렉션

```javascript
match /users/{userId} {
  // 읽기: 본인만
  allow read: if request.auth.uid == userId;

  // 생성: 본인 계정만
  allow create: if request.auth.uid == userId;

  // 수정: 본인만, 특정 필드만
  allow update: if request.auth.uid == userId &&
                   request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['name', 'phone', 'affiliation', 'organization', 'region', 'updatedAt']);
}
```

**보호 필드**: `email`, `id`, `authMethod`, `password` (수정 불가)

---

### Courses 컬렉션

```javascript
match /courses/{courseId} {
  // 읽기: 인증된 모든 사용자
  allow read: if request.auth != null;

  // 쓰기: 관리자만
  allow write: if isAdmin();
}
```

**설명**: 강좌는 모든 사용자가 조회 가능하지만, 생성/수정/삭제는 관리자만 가능

---

### Enrollments 컬렉션

```javascript
match /enrollments/{enrollmentId} {
  // 읽기: 본인 수강신청만
  allow read: if resource.data.userId == request.auth.uid;

  // 생성: 본인 이름으로만
  allow create: if request.resource.data.userId == request.auth.uid;

  // 수정: 진도율만
  allow update: if resource.data.userId == request.auth.uid &&
                   request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['progress', 'lastAccessedAt', 'updatedAt']);

  // 삭제: 금지 (데이터 보존)
  allow delete: if false;
}
```

**보호 필드**: `userId`, `courseId`, `enrolledAt` (생성 후 수정 불가)

---

### Completions 컬렉션 (이수자 명단)

```javascript
match /completions/{completionId} {
  // 읽기: 관리자만
  allow read: if isAdmin();

  // 생성: 진도율 90% 이상일 때만
  allow create: if request.resource.data.userId == request.auth.uid &&
                   request.resource.data.progress >= 90;

  // 수정/삭제: 금지
  allow update: if false;
  allow delete: if false;
}
```

**설명**: 이수자 명단은 한번 생성되면 수정/삭제 불가 (감사 추적)

---

### Settings 컬렉션

```javascript
match /settings/{settingId} {
  // 읽기: 인증된 사용자
  allow read: if request.auth != null;

  // 쓰기: 관리자만
  allow write: if isAdmin();
}
```

---

## 관리자 권한 설정

### 방법 1: Admins 컬렉션 사용 (권장)

Firebase Console에서 `admins` 컬렉션에 관리자 문서를 수동으로 추가:

```javascript
// Document ID: {관리자 Firebase UID}
{
  "role": "admin",
  "email": "admin@example.com",
  "name": "관리자",
  "createdAt": "2025-10-02T00:00:00Z"
}
```

**보안 규칙**:
```javascript
function isAdmin() {
  return request.auth != null &&
         exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

### 방법 2: Custom Claims 사용 (고급)

Firebase Admin SDK를 사용하여 커스텀 클레임 설정:

```javascript
// Node.js (Firebase Admin SDK)
const admin = require('firebase-admin');

await admin.auth().setCustomUserClaims(uid, { admin: true });
```

**보안 규칙**:
```javascript
function isAdmin() {
  return request.auth != null &&
         request.auth.token.admin == true;
}
```

---

## 테스트

### 1. Firebase Console에서 테스트

1. Firebase Console → Firestore → Rules 탭
2. "Rules Playground" 클릭
3. 시뮬레이션 실행:

```
Location: /users/abc123
Operation: get
Auth: Authenticated user (abc123)
Result: ✅ Allow (본인 문서 조회)

Location: /users/xyz789
Operation: get
Auth: Authenticated user (abc123)
Result: ❌ Deny (타인 문서 조회)
```

### 2. 애플리케이션에서 테스트

```javascript
// 테스트 스크립트
async function testFirestoreRules() {
  const db = firebase.firestore();
  const auth = firebase.auth();

  // 로그인
  await auth.signInWithEmailAndPassword('user@example.com', 'password');

  // 테스트 1: 본인 문서 읽기 (성공)
  const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
  console.log('본인 문서 조회:', userDoc.exists);

  // 테스트 2: 타인 문서 읽기 (실패)
  try {
    await db.collection('users').doc('other-user-id').get();
    console.error('❌ 보안 규칙 오류: 타인 문서 조회 가능');
  } catch (error) {
    console.log('✅ 보안 규칙 정상: 타인 문서 조회 차단');
  }

  // 테스트 3: 강좌 목록 조회 (성공)
  const courses = await db.collection('courses').get();
  console.log('강좌 수:', courses.size);
}
```

---

## 보안 체크리스트

- [ ] Firebase Authentication 활성화
- [ ] `firestore.rules` 파일 배포
- [ ] 관리자 계정 설정 (`admins` 컬렉션 생성)
- [ ] 테스트 계정으로 권한 테스트
- [ ] 운영 환경에서 `connection-test` 규칙 제거
- [ ] Firebase Console에서 Rules Playground 테스트
- [ ] 애플리케이션에서 실제 데이터 접근 테스트

---

## 추가 보안 권장사항

### 1. Storage 보안 규칙 (비디오 업로드)

`storage.rules` 파일:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 비디오 파일 업로드
    match /videos/{videoId} {
      // 읽기: 인증된 사용자
      allow read: if request.auth != null;

      // 업로드: 관리자만, 파일 크기 제한
      allow write: if request.auth != null &&
                      request.resource.size < 50 * 1024 * 1024 &&  // 50MB
                      request.resource.contentType.matches('video/.*');
    }
  }
}
```

### 2. Rate Limiting (Cloud Functions)

무차별 대입 공격 방지:

```javascript
// Cloud Functions
const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

exports.enrollCourse = functions.https.onCall(async (data, context) => {
  try {
    await rateLimiter.consume(context.auth.uid);
    // 수강신청 로직
  } catch (error) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many requests');
  }
});
```

### 3. 데이터 검증

Firestore 규칙에서 데이터 유효성 검사:

```javascript
match /users/{userId} {
  allow create: if request.auth.uid == userId &&
                   request.resource.data.name is string &&
                   request.resource.data.name.size() >= 2 &&
                   request.resource.data.name.size() <= 50 &&
                   request.resource.data.email.matches('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
}
```

---

## 문제 해결

### 문제: "Missing or insufficient permissions"

**원인**: 보안 규칙이 데이터 접근을 차단함

**해결**:
1. Firebase Console → Firestore → Rules 탭에서 규칙 확인
2. 사용자가 로그인되어 있는지 확인
3. 올바른 문서 ID를 사용하는지 확인

### 문제: 관리자 권한이 작동하지 않음

**원인**: `admins` 컬렉션이 비어있거나 UID가 일치하지 않음

**해결**:
1. Firebase Console → Firestore → `admins` 컬렉션 확인
2. Document ID가 관리자의 Firebase UID와 정확히 일치하는지 확인
3. `role: "admin"` 필드가 있는지 확인

### 문제: 규칙 배포 후 변경사항이 반영되지 않음

**원인**: 캐싱 또는 배포 지연

**해결**:
```bash
# 강제 배포
firebase deploy --only firestore:rules --force

# 배포 상태 확인
firebase projects:list
```

---

## 참고 자료

- [Firebase Security Rules 공식 문서](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 보안 규칙 테스트](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**작성일**: 2025-10-02
**버전**: 1.0
**문의**: 프로젝트 관리자
