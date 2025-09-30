// Firebase 설정 파일
// 실제 사용 시에는 Firebase Console에서 생성한 설정값으로 교체해야 합니다.

const firebaseConfig = {
    apiKey: "AIzaSyAW1hX726N0EQv6uW0_6yUyGCsWylYlEEI",
    authDomain: "lms-26168.firebaseapp.com",
    databaseURL: "https://lms-26168-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "lms-26168",
    storageBucket: "lms-26168.firebasestorage.app",
    messagingSenderId: "264403082469",
    appId: "1:264403082469:web:ccc553057db178fb22080c",
    measurementId: "G-ZSE5YGGNBF"
};

// Firebase 초기화
let app, auth, db, storage, analytics;

// Firebase 초기화 함수
function initializeFirebase() {
    try {
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