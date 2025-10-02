# Firestore Index 생성 가이드

## 문제 상황

LMS 로그인 시 다음 에러가 발생합니다:
```
FirebaseError: The query requires an index.
```

이는 Firestore에서 복합 쿼리(여러 필드 조건)를 사용할 때 필요한 인덱스가 없기 때문입니다.

## 해결 방법

### 방법 1: 자동 인덱스 생성 (권장)

1. **브라우저 콘솔에 표시된 링크 클릭**
   - 에러 메시지에 있는 URL을 클릭하면 자동으로 인덱스 생성 페이지로 이동합니다
   - 예시: `https://console.firebase.google.com/v1/r/project/lms-26168/firestore/indexes?create_composite=...`

2. **"인덱스 만들기" 버튼 클릭**
   - Firebase Console에서 자동으로 필요한 인덱스 설정이 채워집니다
   - "만들기" 버튼을 클릭하여 인덱스를 생성합니다

3. **인덱스 빌드 대기**
   - 인덱스가 생성되는 데 몇 분 정도 소요됩니다
   - 상태가 "빌드 중" → "사용 설정됨"으로 변경되면 완료

### 방법 2: 수동 인덱스 생성

1. **Firebase Console 접속**
   - https://console.firebase.google.com
   - 프로젝트 선택: `lms-26168`

2. **Firestore Database → 색인 탭으로 이동**
   - 왼쪽 메뉴에서 "Firestore Database" 클릭
   - 상단 탭에서 "색인" 또는 "Indexes" 클릭

3. **복합 색인 추가**
   - "복합 색인 만들기" 버튼 클릭

4. **인덱스 설정**

   **Enrollments 컬렉션 인덱스:**
   ```
   컬렉션 ID: enrollments

   필드:
   - userId (오름차순)
   - enrolledAt (내림차순)
   - __name__ (내림차순)

   쿼리 범위: 컬렉션
   ```

5. **생성 및 대기**
   - "만들기" 버튼 클릭
   - 상태가 "사용 설정됨"이 될 때까지 대기 (1-5분)

### 방법 3: Firebase CLI 사용

`firestore.indexes.json` 파일을 생성하여 자동 배포:

```json
{
  "indexes": [
    {
      "collectionGroup": "enrollments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "enrolledAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "courses",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

배포 명령:
```bash
firebase deploy --only firestore:indexes
```

## 필요한 인덱스 목록

### 1. enrollments 컬렉션
- **목적**: 사용자별 수강신청 조회 + 날짜순 정렬
- **필드**: userId (↑), enrolledAt (↓)

### 2. courses 컬렉션 (선택사항)
- **목적**: 카테고리별 강좌 조회 + 날짜순 정렬
- **필드**: category (↑), createdAt (↓)

## 검증 방법

1. **Firebase Console에서 확인**
   - Firestore Database → 색인 탭
   - 모든 인덱스 상태가 "사용 설정됨"인지 확인

2. **웹사이트에서 테스트**
   - http://data4u4u.mycafe24.com/lms.html 접속
   - 로그인 (kd12345@gmail.com)
   - 브라우저 콘솔(F12)에서 에러 없이 "내 강좌" 로드되는지 확인

3. **콘솔 로그 확인**
   ```
   ✅ ${숫자}개의 수강신청 데이터 로드 완료
   ```
   이 메시지가 보이면 성공!

## 트러블슈팅

### Q: 인덱스가 "빌드 중" 상태에서 멈춰있어요
A: 보통 1-5분 소요됩니다. 10분 이상 걸리면 새로고침해보세요.

### Q: 여러 개의 인덱스 에러가 발생해요
A: 각 에러마다 자동 생성 링크를 클릭하여 모든 인덱스를 생성하세요.

### Q: 인덱스를 삭제하고 싶어요
A: Firebase Console → Firestore → 색인 탭에서 삭제 가능합니다.

## 참고 자료

- [Firestore 인덱스 공식 문서](https://firebase.google.com/docs/firestore/query-data/indexing)
- [복합 인덱스 가이드](https://firebase.google.com/docs/firestore/query-data/index-overview)
