// Firebase 설정 파일
// 실제 사용 시에는 Firebase Console에서 생성한 설정값으로 교체해야 합니다.

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyAW1hX726N0EQv6uW0_6yUyGCsWylYlEEI",
    authDomain: "lms-26168.firebaseapp.com",
    databaseURL: "https://lms-26168-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "lms-26168",
    storageBucket: "lms-26168.firebasestorage.app",
    messagingSenderId: "264403082469",
    appId: "1:264403082469:web:74f35eaec8e2c2f322080c",
    measurementId: "G-9XGFHD0R9P"
};

// 로컬 설정 파일이 있다면 사용 (개발용)
console.log('🔧 Firebase 설정 병합 시도...');
console.log('기본 설정:', firebaseConfig);

if (typeof firebaseConfigLocal !== 'undefined') {
    console.log('✓ 로컬 설정 파일 발견:', firebaseConfigLocal);
    Object.assign(firebaseConfig, firebaseConfigLocal);
    console.log('✓ 설정 병합 완료:', firebaseConfig);
} else {
    console.warn('⚠ firebaseConfigLocal 변수가 정의되지 않았습니다.');
    console.log('현재 전역 변수:', Object.keys(window).filter(key => key.includes('firebase')));
}

// Firebase 초기화
let app, auth, db, storage, analytics;

// Firebase 초기화 함수
function initializeFirebase() {
    try {
        console.log('🔥 Firebase 초기화 시작...');
        console.log('사용할 설정:', firebaseConfig);

        // 설정 유효성 검사
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_")) {
            console.warn('❌ Firebase 설정이 불완전합니다.');
            return false;
        }

        // Firebase 앱 초기화
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase 앱 초기화 완료');
        } else {
            app = firebase.app();
            console.log('✅ 기존 Firebase 앱 사용');
        }

        // 서비스 초기화
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        console.log('✅ Firebase 서비스 초기화 완료');

        // Analytics 초기화 (선택사항)
        if (firebaseConfig.measurementId && typeof firebase.analytics !== 'undefined') {
            analytics = firebase.analytics();
            console.log('✅ Firebase Analytics 초기화 완료');
        }

        // 연결 테스트
        console.log('🔗 Firebase 연결 테스트 중...');

        // Firestore 연결 테스트
        db.enableNetwork().then(() => {
            console.log('✅ Firestore 네트워크 연결 성공');
        }).catch(error => {
            console.warn('⚠️ Firestore 네트워크 연결 경고:', error.message);
        });

        console.log('🎉 Firebase 초기화 완료!');
        console.log('📋 프로젝트 정보:');
        console.log('  - 프로젝트 ID:', firebaseConfig.projectId);
        console.log('  - 인증 도메인:', firebaseConfig.authDomain);
        console.log('  - 앱 ID:', firebaseConfig.appId);

        return true;
    } catch (error) {
        console.error('❌ Firebase 초기화 오류:', error);
        console.log('📱 로컬 모드로 실행됩니다.');
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