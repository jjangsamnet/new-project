// 전역 오류 핸들러
// 예상치 못한 오류 발생 시 앱이 중단되지 않도록 처리

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // 최대 저장할 오류 수
        this.init();
    }

    init() {
        // 전역 JavaScript 오류 핸들러
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'error',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                timestamp: new Date().toISOString()
            });

            // 오류를 콘솔에만 표시하고 기본 동작은 방지하지 않음
            return false;
        });

        // 처리되지 않은 Promise 거부 핸들러
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'unhandledRejection',
                message: event.reason?.message || event.reason || 'Unhandled Promise Rejection',
                promise: event.promise,
                error: event.reason,
                timestamp: new Date().toISOString()
            });

            // 사용자에게 친화적인 메시지 표시
            console.error('처리되지 않은 Promise 오류:', event.reason);
        });

        // 리소스 로딩 오류 핸들러
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError({
                    type: 'resourceError',
                    target: event.target.tagName,
                    src: event.target.src || event.target.href,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);

        console.log('✅ 전역 오류 핸들러 초기화 완료');
    }

    /**
     * 오류 처리
     * @param {object} errorInfo - 오류 정보
     */
    handleError(errorInfo) {
        // 오류 저장
        this.errors.push(errorInfo);

        // 최대 개수 초과 시 오래된 오류 제거
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // 콘솔에 상세 정보 출력
        console.error('🚨 오류 발생:', errorInfo);

        // 심각한 오류인지 판단
        const isCritical = this.isCriticalError(errorInfo);

        if (isCritical) {
            this.handleCriticalError(errorInfo);
        }

        // 개발 환경에서는 추가 정보 표시
        if (this.isDevelopment()) {
            console.group('오류 상세 정보');
            console.log('Type:', errorInfo.type);
            console.log('Message:', errorInfo.message);
            console.log('Time:', errorInfo.timestamp);
            if (errorInfo.filename) {
                console.log('File:', errorInfo.filename);
                console.log('Line:', errorInfo.line);
                console.log('Column:', errorInfo.column);
            }
            console.groupEnd();
        }
    }

    /**
     * 리소스 로딩 오류 처리
     * @param {object} errorInfo - 오류 정보
     */
    handleResourceError(errorInfo) {
        console.warn('⚠️ 리소스 로딩 실패:', errorInfo);

        // 중요한 리소스 로딩 실패 시 사용자에게 알림
        if (errorInfo.target === 'SCRIPT') {
            console.error('스크립트 로딩 실패. 일부 기능이 작동하지 않을 수 있습니다.');
        }
    }

    /**
     * 심각한 오류인지 판단
     * @param {object} errorInfo
     * @returns {boolean}
     */
    isCriticalError(errorInfo) {
        const criticalPatterns = [
            'Cannot read property',
            'Cannot read properties',
            'is not a function',
            'is not defined',
            'Unexpected token',
            'SyntaxError',
            'ReferenceError'
        ];

        return criticalPatterns.some(pattern =>
            errorInfo.message?.includes(pattern)
        );
    }

    /**
     * 심각한 오류 처리
     * @param {object} errorInfo
     */
    handleCriticalError(errorInfo) {
        console.error('🔴 심각한 오류 감지:', errorInfo.message);

        // Firebase나 외부 서비스 오류는 폴백
        if (errorInfo.message?.includes('Firebase') ||
            errorInfo.message?.includes('firestore')) {
            console.warn('Firebase 오류 - localStorage 폴백 사용');
        }
    }

    /**
     * 개발 환경 감지
     * @returns {boolean}
     */
    isDevelopment() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }

    /**
     * 저장된 오류 목록 가져오기
     * @returns {array}
     */
    getErrors() {
        return this.errors;
    }

    /**
     * 오류 목록 초기화
     */
    clearErrors() {
        this.errors = [];
        console.log('오류 목록이 초기화되었습니다.');
    }

    /**
     * 오류 통계
     * @returns {object}
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: this.errors.slice(-10)
        };

        this.errors.forEach(error => {
            const type = error.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * 수동으로 오류 로깅
     * @param {string} message
     * @param {object} context
     */
    logError(message, context = {}) {
        this.handleError({
            type: 'manual',
            message: message,
            context: context,
            timestamp: new Date().toISOString()
        });
    }
}

// Safe JSON.parse wrapper
function safeJSONParse(jsonString, fallback = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('JSON 파싱 오류:', error);
        errorHandler.logError('JSON 파싱 실패', {
            input: jsonString?.substring(0, 100),
            error: error.message
        });
        return fallback;
    }
}

// Safe localStorage access
const safeLocalStorage = {
    getItem(key, fallback = null) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? item : fallback;
        } catch (error) {
            console.error('localStorage 읽기 오류:', error);
            errorHandler.logError('localStorage 접근 실패', {
                key: key,
                error: error.message
            });
            return fallback;
        }
    },

    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error('localStorage 쓰기 오류:', error);
            errorHandler.logError('localStorage 저장 실패', {
                key: key,
                error: error.message
            });
            return false;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('localStorage 삭제 오류:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('localStorage 초기화 오류:', error);
            return false;
        }
    }
};

// Safe DOM element selector
function safeQuerySelector(selector, parent = document) {
    try {
        const element = parent.querySelector(selector);
        if (!element) {
            console.warn(`요소를 찾을 수 없습니다: ${selector}`);
        }
        return element;
    } catch (error) {
        console.error('DOM 선택자 오류:', error);
        errorHandler.logError('DOM 요소 선택 실패', {
            selector: selector,
            error: error.message
        });
        return null;
    }
}

// 전역 인스턴스 생성
const errorHandler = new ErrorHandler();

// 개발자 도구용 전역 함수
window.getErrorStats = () => errorHandler.getErrorStats();
window.clearErrors = () => errorHandler.clearErrors();
