// 비밀번호 해싱 유틸리티
// 브라우저 환경에서 사용 가능한 경량 해싱 라이브러리

class CryptoUtils {
    constructor() {
        // SHA-256을 사용한 간단한 해싱 (브라우저 내장 API 사용)
        this.encoder = new TextEncoder();
    }

    /**
     * 비밀번호를 해싱합니다
     * @param {string} password - 평문 비밀번호
     * @returns {Promise<string>} 해싱된 비밀번호 (hex 문자열)
     */
    async hashPassword(password) {
        try {
            // Salt 생성 (랜덤 16바이트)
            const salt = this.generateSalt();

            // 비밀번호 + Salt 해싱
            const saltedPassword = password + salt;
            const hashBuffer = await crypto.subtle.digest(
                'SHA-256',
                this.encoder.encode(saltedPassword)
            );

            // Buffer를 hex 문자열로 변환
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Salt와 해시를 함께 저장 (salt$hash 형식)
            return `${salt}$${hashHex}`;
        } catch (error) {
            console.error('비밀번호 해싱 오류:', error);
            // 폴백: 간단한 해싱 (덜 안전하지만 평문보다는 나음)
            return this.fallbackHash(password);
        }
    }

    /**
     * 비밀번호를 검증합니다
     * @param {string} password - 입력된 평문 비밀번호
     * @param {string} hashedPassword - 저장된 해싱된 비밀번호
     * @returns {Promise<boolean>} 일치 여부
     */
    async verifyPassword(password, hashedPassword) {
        try {
            // 저장된 해시에서 salt 추출
            const [salt, storedHash] = hashedPassword.split('$');

            if (!salt || !storedHash) {
                // 형식이 맞지 않으면 (레거시 평문 비밀번호일 수 있음)
                console.warn('해시 형식이 올바르지 않습니다. 평문 비교 시도');
                return password === hashedPassword;
            }

            // 입력된 비밀번호를 같은 salt로 해싱
            const saltedPassword = password + salt;
            const hashBuffer = await crypto.subtle.digest(
                'SHA-256',
                this.encoder.encode(saltedPassword)
            );

            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 해시 비교
            return hashHex === storedHash;
        } catch (error) {
            console.error('비밀번호 검증 오류:', error);
            // 폴백: 평문 비교
            return password === hashedPassword;
        }
    }

    /**
     * 랜덤 Salt 생성
     * @returns {string} 16자리 hex 문자열
     */
    generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * 폴백 해싱 (Web Crypto API 사용 불가 시)
     * @param {string} password
     * @returns {string}
     */
    fallbackHash(password) {
        let hash = 0;
        const salt = Math.random().toString(36).substring(2, 15);
        const combined = password + salt;

        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return `${salt}$${hash.toString(16)}`;
    }

    /**
     * 레거시 평문 비밀번호를 해싱된 비밀번호로 마이그레이션
     * @param {string} plainPassword - 평문 비밀번호
     * @returns {Promise<string>} 해싱된 비밀번호
     */
    async migratePassword(plainPassword) {
        return await this.hashPassword(plainPassword);
    }

    /**
     * 비밀번호 강도 검사
     * @param {string} password
     * @returns {object} {isStrong: boolean, score: number, feedback: string[]}
     */
    checkPasswordStrength(password) {
        const feedback = [];
        let score = 0;

        // 길이 체크
        if (password.length < 8) {
            feedback.push('최소 8자 이상이어야 합니다');
        } else if (password.length >= 12) {
            score += 2;
        } else {
            score += 1;
        }

        // 대문자 포함 체크
        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('대문자를 포함해야 합니다');
        }

        // 소문자 포함 체크
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('소문자를 포함해야 합니다');
        }

        // 숫자 포함 체크
        if (/[0-9]/.test(password)) {
            score += 1;
        } else {
            feedback.push('숫자를 포함해야 합니다');
        }

        // 특수문자 포함 체크
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score += 1;
        } else {
            feedback.push('특수문자를 포함하는 것이 좋습니다');
        }

        // 일반적인 비밀번호 패턴 체크
        const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111'];
        if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
            score -= 2;
            feedback.push('너무 일반적인 패턴입니다');
        }

        return {
            isStrong: score >= 4 && password.length >= 8,
            score: Math.max(0, Math.min(score, 6)),
            feedback: feedback
        };
    }
}

// 전역 인스턴스 생성
const cryptoUtils = new CryptoUtils();
