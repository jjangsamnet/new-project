// Rate Limiter 유틸리티
// 브루트 포스 공격, 스팸 방지

class RateLimiter {
    constructor() {
        // 각 작업별 제한 설정
        this.limits = {
            login: {
                maxAttempts: 5,
                windowMs: 15 * 60 * 1000,  // 15분
                blockDurationMs: 30 * 60 * 1000  // 30분 차단
            },
            register: {
                maxAttempts: 3,
                windowMs: 60 * 60 * 1000,  // 1시간
                blockDurationMs: 60 * 60 * 1000  // 1시간 차단
            },
            enrollment: {
                maxAttempts: 10,
                windowMs: 60 * 1000,  // 1분
                blockDurationMs: 5 * 60 * 1000  // 5분 차단
            },
            api: {
                maxAttempts: 100,
                windowMs: 60 * 1000,  // 1분
                blockDurationMs: 10 * 60 * 1000  // 10분 차단
            }
        };

        // localStorage에 저장된 시도 기록
        this.storageKey = 'rate_limiter_attempts';
    }

    /**
     * 시도 기록 가져오기
     * @returns {Object}
     */
    getAttempts() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Rate limiter 저장소 읽기 오류:', error);
            return {};
        }
    }

    /**
     * 시도 기록 저장
     * @param {Object} attempts
     */
    saveAttempts(attempts) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(attempts));
        } catch (error) {
            console.error('Rate limiter 저장소 쓰기 오류:', error);
        }
    }

    /**
     * 식별자 생성 (IP 대신 브라우저 fingerprint 사용)
     * @param {string} action - 작업 유형
     * @param {string} identifier - 추가 식별자 (이메일 등)
     * @returns {string}
     */
    getKey(action, identifier = '') {
        // 브라우저 fingerprint (간단 버전)
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset()
        ].join('|');

        // 해시 생성 (간단한 해시)
        const hash = this.simpleHash(fingerprint);
        return `${action}_${hash}_${identifier}`;
    }

    /**
     * 간단한 문자열 해시
     * @param {string} str
     * @returns {string}
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Rate limit 체크
     * @param {string} action - 작업 유형 (login, register, enrollment, api)
     * @param {string} identifier - 추가 식별자
     * @returns {Object} - { allowed: boolean, remainingAttempts: number, resetTime: number, blockedUntil: number }
     */
    checkLimit(action, identifier = '') {
        const config = this.limits[action];
        if (!config) {
            console.warn(`Unknown action: ${action}`);
            return { allowed: true, remainingAttempts: Infinity };
        }

        const key = this.getKey(action, identifier);
        const attempts = this.getAttempts();
        const now = Date.now();

        // 해당 키의 기록 가져오기
        const record = attempts[key] || {
            count: 0,
            firstAttempt: now,
            lastAttempt: now,
            blockedUntil: 0
        };

        // 차단 중인지 확인
        if (record.blockedUntil && now < record.blockedUntil) {
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: record.blockedUntil,
                blockedUntil: record.blockedUntil,
                message: `너무 많은 시도로 인해 차단되었습니다. ${this.formatTime(record.blockedUntil - now)} 후에 다시 시도하세요.`
            };
        }

        // 시간 윈도우 초과 시 리셋
        if (now - record.firstAttempt > config.windowMs) {
            record.count = 0;
            record.firstAttempt = now;
            record.blockedUntil = 0;
        }

        // 제한 초과 확인
        if (record.count >= config.maxAttempts) {
            // 차단 설정
            record.blockedUntil = now + config.blockDurationMs;
            attempts[key] = record;
            this.saveAttempts(attempts);

            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: record.blockedUntil,
                blockedUntil: record.blockedUntil,
                message: `최대 시도 횟수를 초과했습니다. ${this.formatTime(config.blockDurationMs)} 동안 차단됩니다.`
            };
        }

        // 허용
        const remainingAttempts = config.maxAttempts - record.count;
        const resetTime = record.firstAttempt + config.windowMs;

        return {
            allowed: true,
            remainingAttempts: remainingAttempts,
            resetTime: resetTime,
            message: `남은 시도 횟수: ${remainingAttempts}`
        };
    }

    /**
     * 시도 기록
     * @param {string} action
     * @param {string} identifier
     * @param {boolean} success - 성공 시 카운터 리셋
     */
    recordAttempt(action, identifier = '', success = false) {
        const key = this.getKey(action, identifier);
        const attempts = this.getAttempts();
        const now = Date.now();

        if (success) {
            // 성공 시 해당 키 삭제
            delete attempts[key];
        } else {
            // 실패 시 카운터 증가
            const record = attempts[key] || {
                count: 0,
                firstAttempt: now,
                lastAttempt: now,
                blockedUntil: 0
            };

            record.count += 1;
            record.lastAttempt = now;
            attempts[key] = record;
        }

        this.saveAttempts(attempts);
    }

    /**
     * 특정 작업의 제한 리셋
     * @param {string} action
     * @param {string} identifier
     */
    reset(action, identifier = '') {
        const key = this.getKey(action, identifier);
        const attempts = this.getAttempts();
        delete attempts[key];
        this.saveAttempts(attempts);
    }

    /**
     * 모든 제한 리셋
     */
    resetAll() {
        localStorage.removeItem(this.storageKey);
    }

    /**
     * 오래된 기록 정리 (24시간 이상)
     */
    cleanup() {
        const attempts = this.getAttempts();
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000;  // 24시간

        let cleaned = false;
        Object.keys(attempts).forEach(key => {
            const record = attempts[key];
            if (now - record.lastAttempt > maxAge) {
                delete attempts[key];
                cleaned = true;
            }
        });

        if (cleaned) {
            this.saveAttempts(attempts);
        }
    }

    /**
     * 시간 포맷팅
     * @param {number} ms
     * @returns {string}
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}시간 ${minutes % 60}분`;
        } else if (minutes > 0) {
            return `${minutes}분 ${seconds % 60}초`;
        } else {
            return `${seconds}초`;
        }
    }

    /**
     * 래퍼 함수: 함수 실행 전 rate limit 체크
     * @param {string} action
     * @param {Function} fn
     * @param {string} identifier
     * @returns {Promise}
     */
    async execute(action, fn, identifier = '') {
        // 체크
        const check = this.checkLimit(action, identifier);

        if (!check.allowed) {
            throw new Error(check.message);
        }

        try {
            // 함수 실행
            const result = await fn();

            // 성공 시 카운터 리셋
            this.recordAttempt(action, identifier, true);

            return result;
        } catch (error) {
            // 실패 시 카운터 증가
            this.recordAttempt(action, identifier, false);

            throw error;
        }
    }

    /**
     * 상태 정보 가져오기 (디버깅용)
     * @returns {Object}
     */
    getStatus() {
        const attempts = this.getAttempts();
        const now = Date.now();

        return Object.keys(attempts).map(key => {
            const record = attempts[key];
            const isBlocked = record.blockedUntil && now < record.blockedUntil;

            return {
                key: key,
                count: record.count,
                isBlocked: isBlocked,
                blockedUntil: isBlocked ? new Date(record.blockedUntil).toLocaleString() : null,
                lastAttempt: new Date(record.lastAttempt).toLocaleString()
            };
        });
    }
}

// 전역 인스턴스
const rateLimiter = new RateLimiter();

// 페이지 로드 시 오래된 기록 정리
rateLimiter.cleanup();

// 전역 헬퍼 함수
window.checkRateLimit = (action, identifier) => rateLimiter.checkLimit(action, identifier);
window.recordRateLimitAttempt = (action, identifier, success) => rateLimiter.recordAttempt(action, identifier, success);
