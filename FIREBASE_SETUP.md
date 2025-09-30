# Firebase 설정 가이드

이 가이드는 LMS 시스템을 Firebase와 연결하는 방법을 설명합니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "lms-system")
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. Firebase 서비스 활성화

### 2.1 Authentication 설정
1. Firebase Console에서 "Authentication" 선택
2. "시작하기" 클릭
3. "Sign-in method" 탭에서 "이메일/비밀번호" 활성화
4. "저장" 클릭

### 2.2 Firestore Database 설정
1. Firebase Console에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 모드 선택:
   - **테스트 모드**: 개발 중에는 테스트 모드 사용
   - **프로덕션 모드**: 실제 서비스 시 보안 규칙 설정 필요
4. 위치 선택 (asia-northeast3 권장 - 서울)

### 2.3 Storage 설정 (동영상 업로드용)
1. Firebase Console에서 "Storage" 선택
2. "시작하기" 클릭
3. 보안 규칙 설정 (테스트 모드 또는 커스텀)
4. 위치 선택

## 3. 웹 앱 설정

1. Firebase Console에서 "프로젝트 설정" (⚙️ 아이콘) 클릭
2. "일반" 탭에서 "앱" 섹션으로 이동
3. "웹" 아이콘 (</>)을 클릭하여 웹 앱 추가
4. 앱 닉네임 입력 (예: "LMS Web App")
5. "Firebase Hosting 설정" 체크 (선택사항)
6. "앱 등록" 클릭

## 4. 설정 정보 복사

Firebase에서 제공하는 설정 정보를 복사하여 `firebase-config.js` 파일에 적용:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

## 5. 보안 규칙 설정

### Firestore 보안 규칙
Firebase Console > Firestore Database > 규칙에서 다음 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 강좌 데이터 - 모든 사용자 읽기 가능, 관리자만 쓰기 가능
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // 사용자 데이터 - 본인만 접근 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 수강신청 데이터 - 본인 데이터만 접근 가능
    match /enrollments/{enrollmentId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // 설정 데이터 - 모든 사용자 읽기 가능, 관리자만 쓰기 가능
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### Storage 보안 규칙
Firebase Console > Storage > 규칙에서 다음 규칙 적용:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 강좌 관련 파일 - 로그인한 사용자만 업로드, 모든 사용자 다운로드
    match /courses/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 사용자 파일 - 본인만 업로드/다운로드
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6. 관리자 권한 설정

관리자 계정에 커스텀 클레임을 추가하려면 Firebase Functions 또는 Admin SDK가 필요합니다.

### Firebase Functions를 이용한 방법:
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // 특정 이메일 주소를 관리자로 설정
  const adminEmails = ['admin@yourdomain.com', 'jjangsam@yourdomain.com'];

  if (adminEmails.includes(context.auth.token.email)) {
    await admin.auth().setCustomUserClaims(context.auth.uid, { admin: true });
    return { message: '관리자 권한이 설정되었습니다.' };
  } else {
    throw new functions.https.HttpsError('permission-denied', '권한이 없습니다.');
  }
});
```

## 7. 데이터베이스 컬렉션 구조

Firebase에서 다음과 같은 컬렉션 구조가 생성됩니다:

```
/courses
  - id: number
  - title: string
  - instructor: string
  - category: string
  - price: string
  - duration: string
  - level: string
  - description: string
  - curriculum: array
  - createdAt: timestamp
  - updatedAt: timestamp

/users
  - id: string (auth UID)
  - email: string
  - name: string
  - phone: string
  - registeredAt: timestamp

/enrollments
  - id: string
  - userId: string
  - courseId: number
  - paymentMethod: string
  - status: string
  - enrolledAt: timestamp

/settings
  - main: object (모든 설정 정보)
```

## 8. 로컬 개발 환경

Firebase 설정이 완료되지 않았거나 오프라인 환경에서는 자동으로 localStorage를 사용하는 폴백 모드로 작동합니다.

## 9. 배포

Firebase Hosting을 사용하여 배포하려면:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 주의사항

1. **API 키 보안**: `firebase-config.js` 파일은 공개 저장소에 커밋하지 마세요
2. **보안 규칙**: 프로덕션 환경에서는 반드시 적절한 보안 규칙을 설정하세요
3. **데이터 백업**: 정기적으로 Firestore 데이터를 백업하세요
4. **비용 모니터링**: Firebase 사용량을 정기적으로 확인하세요

## 문제 해결

- **CORS 오류**: Firebase Hosting을 사용하거나 로컬 서버에서 테스트하세요
- **권한 오류**: 보안 규칙과 사용자 인증 상태를 확인하세요
- **연결 실패**: 네트워크 상태와 Firebase 설정을 확인하세요