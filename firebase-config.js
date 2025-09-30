// Firebase 설정 파일
// 실제 사용 시에는 Firebase Console에서 생성한 설정값으로 교체해야 합니다.

// Firebase 설정 - 실제 값으로 교체 필요
// firebase-config.local.js 파일을 생성하거나 환경 변수 사용
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.region.firebasedatabase.app",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// 로컬 설정 파일이 있다면 사용 (개발용)
if (typeof firebaseConfigLocal !== 'undefined') {
    Object.assign(firebaseConfig, firebaseConfigLocal);
}

// Firebase 초기화
let app, auth, db, storage, analytics;

// Firebase 초기화 함수
function initializeFirebase() {
    try {
        // 설정 유효성 검사
        if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
            console.warn('Firebase 설정이 기본값입니다. firebase-config.local.js를 생성하여 실제 설정을 사용하세요.');
            return false;
        }

        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();

        // Analytics 초기화 (선택사항)
        if (firebaseConfig.measurementId && typeof firebase.analytics !== 'undefined') {
            analytics = firebase.analytics();
        }

        console.log('Firebase가 성공적으로 초기화되었습니다.');
        console.log('프로젝트:', firebaseConfig.projectId);
        console.log('앱 ID:', firebaseConfig.appId);
        return true;
    } catch (error) {
        console.error('Firebase 초기화 오류:', error);
        console.log('로컬 모드로 실행됩니다.');
        return false;
    }
}

// Firebase 사용 가능 여부 확인
let isFirebaseEnabled = false;

// Firebase 라이브러리 로드 확인 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        isFirebaseEnabled = initializeFirebase();
    } else {
        console.log('Firebase SDK가 로드되지 않았습니다. 로컬 모드로 실행됩니다.');
    }
});