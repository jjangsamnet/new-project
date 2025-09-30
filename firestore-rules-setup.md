# Firebase Firestore 보안 규칙 설정

Firebase Console에서 Firestore 보안 규칙을 다음과 같이 설정해야 합니다.

## 1. Firebase Console 접속
1. https://console.firebase.google.com/ 접속
2. `lms-26168` 프로젝트 선택
3. 좌측 메뉴에서 "Firestore Database" 클릭
4. "규칙" 탭 클릭

## 2. 개발/테스트용 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 컬렉션 - 인증된 사용자만 접근
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }

    // 강좌 컬렉션 - 모든 사용자 읽기 가능, 인증된 사용자만 쓰기
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 수강신청 컬렉션 - 인증된 사용자만 접근
    match /enrollments/{enrollmentId} {
      allow read, write: if request.auth != null;
    }

    // 설정 컬렉션 - 인증된 사용자만 접근
    match /settings/{settingId} {
      allow read, write: if request.auth != null;
    }

    // 연결 테스트용 임시 컬렉션 - 모든 사용자 접근 허용
    match /connection-test/{testId} {
      allow read, write: if true;
    }
  }
}
```

## 3. 매우 관대한 테스트용 규칙 (임시로만 사용)

만약 위 규칙으로도 문제가 있다면, 테스트를 위해 임시로 다음 규칙을 사용할 수 있습니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **주의**: 이 규칙은 보안이 전혀 없으므로 테스트 후 반드시 위의 적절한 규칙으로 변경해야 합니다.

## 4. 규칙 적용 방법
1. 위 규칙을 복사
2. Firebase Console > Firestore Database > 규칙 탭에서 붙여넣기
3. "게시" 버튼 클릭
4. 규칙이 적용될 때까지 1-2분 대기

## 5. 확인 방법
- `firebase-test.html` 페이지에서 "전체 테스트 실행" 버튼으로 확인
- `login-test.html` 페이지에서 "Firebase 연결 테스트" 버튼으로 확인