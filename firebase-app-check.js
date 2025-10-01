// Firebase App Check 통합
// CSRF 공격 방지 및 요청 출처 검증

class FirebaseAppCheckIntegration {
    constructor() {
        this.isAppCheckReady = false;
        this.appCheckToken = null;
        this.tokenExpiryTime = null;
    }

    /**
     * Firebase App Check 초기화
     * 프로덕션 환경에서 reCAPTCHA v3 사용
     */
    async initialize() {
        try {
            // Firebase가 초기화되었는지 확인
            if (typeof firebase === 'undefined' || !firebase.apps.length) {
                console.warn('⚠️ Firebase가 초기화되지 않음 - App Check 건너뜀');
                return false;
            }

            // App Check 사용 가능 여부 확인
            if (typeof firebase.appCheck === 'undefined') {
                console.warn('⚠️ Firebase App Check SDK가 로드되지 않음');
                return false;
            }

            // 프로덕션 환경 확인
            const isProduction = window.location.hostname !== 'localhost' &&
                                window.location.hostname !== '127.0.0.1';

            if (isProduction) {
                // reCAPTCHA v3 프로바이더 (실제 프로덕션용)
                // 실제 사이트 키로 교체 필요
                const appCheck = firebase.appCheck();
                await appCheck.activate(
                    // reCAPTCHA v3 사이트 키 (Firebase Console에서 생성)
                    'YOUR_RECAPTCHA_V3_SITE_KEY',
                    // 자동 토큰 갱신 활성화
                    true
                );

                console.log('✅ Firebase App Check 활성화 (프로덕션 - reCAPTCHA v3)');
            } else {
                // 개발 환경에서는 디버그 토큰 사용
                const appCheck = firebase.appCheck();

                // 디버그 토큰 활성화 (개발 환경)
                self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

                await appCheck.activate(
                    new firebase.appCheck.ReCaptchaV3Provider('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'), // 테스트 키
                    true
                );

                console.log('✅ Firebase App Check 활성화 (개발 - 디버그 모드)');
            }

            this.isAppCheckReady = true;
            return true;

        } catch (error) {
            console.error('❌ Firebase App Check 초기화 오류:', error);
            return false;
        }
    }

    /**
     * App Check 토큰 가져오기
     * @param {boolean} forceRefresh - 강제 토큰 갱신
     * @returns {Promise<string|null>} App Check 토큰
     */
    async getToken(forceRefresh = false) {
        try {
            if (!this.isAppCheckReady) {
                console.warn('⚠️ App Check가 초기화되지 않음');
                return null;
            }

            // 캐시된 토큰 확인 (만료 안 됨)
            if (!forceRefresh && this.appCheckToken && this.tokenExpiryTime) {
                const now = Date.now();
                if (now < this.tokenExpiryTime) {
                    console.log('✅ 캐시된 App Check 토큰 사용');
                    return this.appCheckToken;
                }
            }

            // 새 토큰 요청
            const appCheck = firebase.appCheck();
            const tokenResult = await appCheck.getToken(forceRefresh);

            this.appCheckToken = tokenResult.token;
            // 토큰은 1시간 유효 (55분 후 갱신)
            this.tokenExpiryTime = Date.now() + (55 * 60 * 1000);

            console.log('✅ 새 App Check 토큰 발급');
            return this.appCheckToken;

        } catch (error) {
            console.error('❌ App Check 토큰 발급 오류:', error);
            return null;
        }
    }

    /**
     * Firestore 요청에 App Check 헤더 추가
     * @param {Object} request - Firestore 요청 객체
     * @returns {Object} App Check 헤더가 추가된 요청
     */
    async addAppCheckHeader(request) {
        const token = await this.getToken();

        if (token) {
            // Firebase SDK가 자동으로 처리하므로 수동으로 추가할 필요 없음
            // 하지만 커스텀 API 호출 시 사용 가능
            return {
                ...request,
                headers: {
                    ...(request.headers || {}),
                    'X-Firebase-AppCheck': token
                }
            };
        }

        return request;
    }

    /**
     * API 요청에 CSRF 토큰 추가
     * @param {Object} request - API 요청 객체
     * @returns {Object} CSRF 토큰이 추가된 요청
     */
    async protectRequest(request) {
        const token = await this.getToken();

        if (token) {
            return {
                ...request,
                headers: {
                    ...(request.headers || {}),
                    'X-Firebase-AppCheck': token,
                    'X-Requested-With': 'XMLHttpRequest' // CSRF 방지
                }
            };
        }

        return request;
    }

    /**
     * 상태 확인
     * @returns {Object} App Check 상태 정보
     */
    getStatus() {
        return {
            isReady: this.isAppCheckReady,
            hasToken: !!this.appCheckToken,
            tokenExpiry: this.tokenExpiryTime ? new Date(this.tokenExpiryTime).toLocaleString() : null
        };
    }
}

// 전역 인스턴스 생성
const firebaseAppCheck = new FirebaseAppCheckIntegration();

// Firebase 초기화 후 App Check 초기화 (자동)
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    // Firebase가 이미 초기화된 경우
    firebaseAppCheck.initialize().then(success => {
        if (success) {
            console.log('🛡️ CSRF 보호 활성화 (Firebase App Check)');
        } else {
            console.warn('⚠️ CSRF 보호 비활성화 - App Check 초기화 실패');
        }
    });
}

// Firebase 초기화 이벤트 리스너 (Firebase가 나중에 로드되는 경우)
window.addEventListener('firebase-ready', () => {
    firebaseAppCheck.initialize().then(success => {
        if (success) {
            console.log('🛡️ CSRF 보호 활성화 (Firebase App Check)');
        }
    });
});

// 전역 헬퍼 함수
window.getAppCheckToken = () => firebaseAppCheck.getToken();
window.protectApiRequest = (request) => firebaseAppCheck.protectRequest(request);
