# 개발 워크플로우 가이드

## 📋 작업 순서 (항상 이 순서로!)

### 1️⃣ 코드 수정
```
파일 편집 → 저장
```

### 2️⃣ Git 커밋
```bash
git add [수정한 파일들]
git commit -m "수정 내용 설명"
```

### 3️⃣ FTP 서버 업로드 ⭐ **필수!**
```powershell
# 개별 파일 업로드
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "파일명.js"

# 또는 전체 동기화
powershell -ExecutionPolicy Bypass -File sync-all-to-ftp.ps1
```

### 4️⃣ 브라우저 테스트
```
http://data4u4u.mycafe24.com/lms.html
Ctrl + F5 (강력 새로고침)
```

---

## 🚀 빠른 업로드 명령어

### 자주 수정하는 파일별 명령어

**LMS 스크립트 수정 시:**
```powershell
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "lms-script.js"
```

**관리자 페이지 수정 시:**
```powershell
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "admin-script.js"
```

**강좌 학습 페이지 수정 시:**
```powershell
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "course-learning-script.js"
```

**HTML 수정 시:**
```powershell
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "lms.html"
```

**CSS 수정 시:**
```powershell
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "lms-styles.css"
```

---

## 🔄 전체 파일 동기화

### 언제 사용하나?
- ✅ 여러 파일을 동시에 수정했을 때
- ✅ 첫 배포 시
- ✅ 큰 변경 후 전체 점검 시
- ✅ 서버와 로컬이 달라졌을 때

### 명령어
```powershell
powershell -ExecutionPolicy Bypass -File sync-all-to-ftp.ps1
```

**소요 시간:** 약 2-3분
**업로드 파일:** 25개 (HTML, JS, CSS 전체)

---

## ⚠️ 중요한 규칙

### ❌ 하지 말아야 할 것
1. **수정 후 업로드 안 하기**
   - 로컬에서만 수정하고 서버 업로드 잊어버림
   - 결과: 웹사이트에 변경사항 반영 안 됨

2. **Git 커밋 안 하기**
   - FTP만 올리고 Git 커밋 안 함
   - 결과: 버전 관리 불가, 롤백 불가

3. **테스트 안 하기**
   - 업로드만 하고 실제 웹사이트에서 테스트 안 함
   - 결과: 버그 발견 늦어짐

### ✅ 꼭 해야 할 것
1. **수정 → Git → FTP → 테스트** 순서 지키기
2. **브라우저 강력 새로고침** (Ctrl+F5)
3. **에러 확인** (F12 → Console 탭)

---

## 🛠️ VS Code 사용 시 (권장)

### 자동 업로드 설정

**1. FTP-Simple 확장 설치**
```
Ctrl+Shift+X → "ftp-simple" 검색 → 설치
```

**2. 설정 파일 생성**
```
Ctrl+Shift+P → "FTP-Simple: Config" 입력
```

**.vscode/ftp-simple.json:**
```json
[
    {
        "name": "카페24 LMS",
        "host": "data4u4u.mycafe24.com",
        "port": 21,
        "type": "ftp",
        "username": "data4u4u",
        "password": "wkd23772377",
        "path": "/",
        "autosave": true,
        "confirm": false
    }
]
```

**3. 사용 방법**
```
파일 편집 → Ctrl+S (저장) → 자동 업로드!
```

---

## 📊 체크리스트

### 매 수정마다 확인
- [ ] 파일 수정 완료
- [ ] Git add & commit 완료
- [ ] FTP 업로드 완료
- [ ] 브라우저 테스트 완료
- [ ] 콘솔 에러 없음

### 큰 수정 후 확인
- [ ] 전체 파일 동기화 (sync-all-to-ftp.ps1)
- [ ] 모든 페이지 테스트
  - [ ] index.html (프로젝트 관리)
  - [ ] lms.html (LMS)
  - [ ] admin.html (관리자)
  - [ ] course-learning.html (강좌 학습)
- [ ] Firebase 연결 확인
- [ ] 로그인/회원가입 테스트
- [ ] 수강신청 테스트

---

## 🐛 문제 해결

### "파일이 업로드 안 됨"
```powershell
# 1. FTP 연결 확인
powershell -ExecutionPolicy Bypass -File check-ftp-directory.ps1

# 2. 전체 재동기화
powershell -ExecutionPolicy Bypass -File sync-all-to-ftp.ps1
```

### "웹사이트에 변경사항이 반영 안 됨"
```
1. 브라우저 강력 새로고침: Ctrl+F5
2. 브라우저 캐시 삭제
3. 시크릿 모드로 열기
```

### "스크립트 실행 오류"
```powershell
# PowerShell 실행 정책 변경
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass
```

---

## 🎯 실전 예시

### 예시 1: 버그 수정
```bash
# 1. 코드 수정
파일: lms-script.js (진도율 100% 제한)

# 2. Git 커밋
git add lms-script.js
git commit -m "Fix progress display to cap at 100%"

# 3. FTP 업로드
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "lms-script.js"

# 4. 테스트
브라우저 → http://data4u4u.mycafe24.com/lms.html → Ctrl+F5
```

### 예시 2: 새 기능 추가
```bash
# 1. 여러 파일 수정
파일: lms-script.js, lms-styles.css, lms.html

# 2. Git 커밋
git add lms-script.js lms-styles.css lms.html
git commit -m "Add new search feature"

# 3. 전체 동기화 (여러 파일)
powershell -ExecutionPolicy Bypass -File sync-all-to-ftp.ps1

# 4. 테스트
브라우저 → 전체 기능 테스트
```

---

## 📝 일일 마무리 체크리스트

### 작업 종료 전 확인
- [ ] 모든 수정사항 Git 커밋 완료
- [ ] 모든 파일 FTP 업로드 완료
- [ ] 웹사이트 정상 작동 확인
- [ ] 콘솔 에러 없음 확인
- [ ] Git push (선택사항)

```bash
# 한 번에 확인
git status  # "nothing to commit" 확인
git log -1  # 최근 커밋 확인
```

---

## 🚨 긴급 롤백

### 문제가 생겼을 때
```bash
# 1. 이전 커밋으로 되돌리기
git log  # 이전 커밋 해시 확인
git checkout [커밋해시] -- [파일명]

# 2. 서버에 재업로드
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "파일명"

# 3. 테스트
브라우저에서 확인
```

---

## ⏱️ 예상 소요 시간

| 작업 | 시간 |
|------|------|
| 코드 수정 | 5-30분 |
| Git 커밋 | 30초 |
| **단일 파일 FTP** | **10초** ⭐ |
| **전체 파일 FTP** | **2-3분** |
| 브라우저 테스트 | 1-2분 |
| **총 소요 시간** | **7-35분** |

---

## 💡 프로 팁

### 시간 절약하는 방법
1. **VS Code + FTP-Simple** 사용
   - 저장만 하면 자동 업로드
   - 가장 빠른 방법

2. **자주 쓰는 명령어 배치 파일 생성**
```cmd
@echo off
echo Uploading lms-script.js...
powershell -ExecutionPolicy Bypass -File upload-single-file.ps1 -FileName "lms-script.js"
echo Done!
pause
```
저장: `upload-lms.bat`
실행: 더블클릭

3. **Git alias 설정**
```bash
git config --global alias.ac '!git add -A && git commit -m'
# 사용: git ac "commit message"
```

---

## ✅ 앞으로의 작업 흐름

**매번 이 순서로:**
```
1. 코드 수정
   ↓
2. Git 커밋
   ↓
3. FTP 업로드 ⭐ (절대 빼먹지 말 것!)
   ↓
4. 브라우저 테스트
```

**이 순서를 지키면:**
- ✅ 서버와 로컬이 항상 동기화
- ✅ 버전 관리 완벽
- ✅ 롤백 가능
- ✅ 팀 협업 가능

---

**마지막 확인:** http://data4u4u.mycafe24.com/lms.html
**서버 상태:** 🟢 최신 (2024-12-03)
