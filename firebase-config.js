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
console.log('🔧 Firebase 설정 로드 중...');

// firebaseConfigLocal이 이미 로드되었는지 확인 (firebase-config.local.js)
setTimeout(() => {
    if (typeof firebaseConfigLocal !== 'undefined') {
        console.log('✓ 로컬 설정 파일 발견, 병합 중...');
        Object.assign(firebaseConfig, firebaseConfigLocal);
        console.log('✓ 설정 병합 완료');
    } else {
        console.log('ℹ️ 로컬 설정 파일 없음 - 기본 설정 사용');
    }
    console.log('📋 최종 Firebase 설정:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
    });
}, 100);

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

            // 간단한 연결 테스트
            return db.collection('connection-test').limit(1).get();
        }).then((snapshot) => {
            console.log('✅ Firestore 읽기 테스트 성공 (' + snapshot.size + '개 문서)');
        }).catch(error => {
            console.warn('⚠️ Firestore 연결 경고:', error.code, '-', error.message);

            if (error.code === 'permission-denied') {
                console.warn('권한 오류 - Firebase 보안 규칙을 확인하세요');
            } else if (error.code === 'unavailable') {
                console.warn('서비스 연결 실패 - 네트워크를 확인하세요');
            }
        });

        // Auth 상태 확인
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ 현재 로그인된 사용자:', user.email);
            } else {
                console.log('ℹ️ 현재 로그인된 사용자 없음');
            }
        });

        console.log('🎉 Firebase 초기화 완료!');
        console.log('📋 프로젝트 정보:');
        console.log('  - 프로젝트 ID:', firebaseConfig.projectId);
        console.log('  - 인증 도메인:', firebaseConfig.authDomain);
        console.log('  - 앱 ID:', firebaseConfig.appId);
        console.log('  - 현재 호스트:', window.location.host);

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
    // 약간의 지연을 주어 모든 스크립트가 로드되도록 함
    setTimeout(() => {
        console.log('🔧 Firebase 초기화 시도...');
        console.log('현재 URL:', window.location.href);
        console.log('현재 프로토콜:', window.location.protocol);
        console.log('Firebase 객체 존재:', typeof firebase !== 'undefined');

        // 로드된 스크립트 확인
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const firebaseScripts = scripts.filter(script => script.src.includes('firebase'));
        console.log('로드된 Firebase 스크립트:', firebaseScripts.map(s => s.src));

        // 전역 firebase 관련 변수들 확인
        console.log('전역 firebase 변수들:', Object.keys(window).filter(key => key.toLowerCase().includes('firebase')));

        if (typeof firebase !== 'undefined') {
            console.log('Firebase SDK 버전:', firebase.SDK_VERSION);
            console.log('Firebase apps:', firebase.apps.length);

            isFirebaseEnabled = initializeFirebase();
            console.log('Firebase 활성화 상태:', isFirebaseEnabled);

            if (isFirebaseEnabled) {
                console.log('✅ Firebase 초기화 성공');
                console.log('사용 가능한 서비스:', {
                    auth: typeof auth !== 'undefined',
                    firestore: typeof db !== 'undefined',
                    storage: typeof storage !== 'undefined'
                });
            } else {
                console.error('❌ Firebase 초기화 실패');
            }
        } else {
            console.warn('❌ Firebase SDK가 로드되지 않았습니다.');
            console.log('가능한 원인:');
            console.log('1. 네트워크 연결 문제');
            console.log('2. CDN 차단 (방화벽/보안 프로그램)');
            console.log('3. HTTPS 요구사항 (일부 Firebase 기능)');
            console.log('4. 스크립트 로딩 순서 문제');
            isFirebaseEnabled = false;
        }

        // firebaseService가 있다면 상태 업데이트
        if (typeof firebaseService !== 'undefined') {
            firebaseService.isFirebaseReady = isFirebaseEnabled;
            console.log('firebaseService 상태 업데이트:', firebaseService.isFirebaseReady);
        } else {
            console.warn('⚠️ firebaseService가 아직 로드되지 않았습니다.');
        }

        // 전역 상태 변수 설정
        window.firebaseInitialized = true;
        window.isFirebaseEnabled = isFirebaseEnabled;

        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('firebaseStatusUpdate', {
            detail: { enabled: isFirebaseEnabled }
        }));
    }, 500); // 500ms 지연
});