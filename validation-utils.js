// 폼 입력 검증 유틸리티

class ValidationUtils {
    constructor() {
        // 이메일 정규식
        this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // 한국 휴대폰 번호 정규식
        this.phonePattern = /^010-\d{4}-\d{4}$/;

        // 특수문자 제거용 정규식 (XSS 방어)
        this.xssPattern = /<script|<\/script|javascript:|on\w+\s*=|<iframe|<embed/gi;
    }

    /**
     * 이메일 검증
     * @param {string} email
     * @returns {object} {isValid: boolean, message: string}
     */
    validateEmail(email) {
        if (!email || email.trim() === '') {
            return { isValid: false, message: '이메일을 입력해주세요.' };
        }

        if (email.length > 254) {
            return { isValid: false, message: '이메일이 너무 깁니다.' };
        }

        if (!this.emailPattern.test(email)) {
            return { isValid: false, message: '올바른 이메일 형식이 아닙니다.' };
        }

        return { isValid: true, message: '' };
    }

    /**
     * 비밀번호 검증
     * @param {string} password
     * @param {object} options
     * @returns {object}
     */
    validatePassword(password, options = {}) {
        const {
            minLength = 8,
            maxLength = 100,
            requireUppercase = false,
            requireLowercase = false,
            requireNumber = false,
            requireSpecial = false
        } = options;

        if (!password) {
            return { isValid: false, message: '비밀번호를 입력해주세요.' };
        }

        if (password.length < minLength) {
            return { isValid: false, message: `비밀번호는 최소 ${minLength}자 이상이어야 합니다.` };
        }

        if (password.length > maxLength) {
            return { isValid: false, message: `비밀번호는 최대 ${maxLength}자까지 가능합니다.` };
        }

        if (requireUppercase && !/[A-Z]/.test(password)) {
            return { isValid: false, message: '비밀번호에 대문자가 포함되어야 합니다.' };
        }

        if (requireLowercase && !/[a-z]/.test(password)) {
            return { isValid: false, message: '비밀번호에 소문자가 포함되어야 합니다.' };
        }

        if (requireNumber && !/[0-9]/.test(password)) {
            return { isValid: false, message: '비밀번호에 숫자가 포함되어야 합니다.' };
        }

        if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { isValid: false, message: '비밀번호에 특수문자가 포함되어야 합니다.' };
        }

        return { isValid: true, message: '' };
    }

    /**
     * 휴대폰 번호 검증
     * @param {string} phone
     * @returns {object}
     */
    validatePhone(phone) {
        if (!phone || phone.trim() === '') {
            return { isValid: false, message: '휴대폰 번호를 입력해주세요.' };
        }

        if (!this.phonePattern.test(phone)) {
            return { isValid: false, message: '올바른 형식이 아닙니다. (010-0000-0000)' };
        }

        return { isValid: true, message: '' };
    }

    /**
     * 이름 검증
     * @param {string} name
     * @returns {object}
     */
    validateName(name) {
        if (!name || name.trim() === '') {
            return { isValid: false, message: '이름을 입력해주세요.' };
        }

        if (name.length < 2) {
            return { isValid: false, message: '이름은 최소 2자 이상이어야 합니다.' };
        }

        if (name.length > 50) {
            return { isValid: false, message: '이름은 최대 50자까지 가능합니다.' };
        }

        // XSS 공격 패턴 검사
        if (this.xssPattern.test(name)) {
            return { isValid: false, message: '이름에 사용할 수 없는 문자가 포함되어 있습니다.' };
        }

        return { isValid: true, message: '' };
    }

    /**
     * 텍스트 입력 검증 (제목, 설명 등)
     * @param {string} text
     * @param {object} options
     * @returns {object}
     */
    validateText(text, options = {}) {
        const {
            fieldName = '입력값',
            minLength = 0,
            maxLength = 1000,
            required = true,
            allowHTML = false
        } = options;

        if (required && (!text || text.trim() === '')) {
            return { isValid: false, message: `${fieldName}을(를) 입력해주세요.` };
        }

        if (text && text.length < minLength) {
            return { isValid: false, message: `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.` };
        }

        if (text && text.length > maxLength) {
            return { isValid: false, message: `${fieldName}은(는) 최대 ${maxLength}자까지 가능합니다.` };
        }

        // HTML/스크립트 태그 검사
        if (!allowHTML && this.xssPattern.test(text)) {
            return { isValid: false, message: `${fieldName}에 사용할 수 없는 문자가 포함되어 있습니다.` };
        }

        return { isValid: true, message: '' };
    }

    /**
     * 파일 검증
     * @param {File} file
     * @param {object} options
     * @returns {object}
     */
    validateFile(file, options = {}) {
        const {
            maxSize = 50 * 1024 * 1024, // 기본 50MB
            allowedTypes = [],
            allowedExtensions = []
        } = options;

        if (!file) {
            return { isValid: false, message: '파일을 선택해주세요.' };
        }

        // 파일 크기 검증
        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / 1024 / 1024);
            return { isValid: false, message: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.` };
        }

        // 파일 타입 검증
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return { isValid: false, message: '지원하지 않는 파일 형식입니다.' };
        }

        // 파일 확장자 검증
        if (allowedExtensions.length > 0) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(fileExtension)) {
                return { isValid: false, message: `허용된 확장자: ${allowedExtensions.join(', ')}` };
            }
        }

        return { isValid: true, message: '' };
    }

    /**
     * URL 검증
     * @param {string} url
     * @returns {object}
     */
    validateURL(url) {
        if (!url || url.trim() === '') {
            return { isValid: false, message: 'URL을 입력해주세요.' };
        }

        try {
            const urlObj = new URL(url);

            // 프로토콜 검증 (http, https만 허용)
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return { isValid: false, message: 'HTTP 또는 HTTPS URL만 허용됩니다.' };
            }

            return { isValid: true, message: '' };
        } catch (e) {
            return { isValid: false, message: '올바른 URL 형식이 아닙니다.' };
        }
    }

    /**
     * 숫자 범위 검증
     * @param {number} value
     * @param {object} options
     * @returns {object}
     */
    validateNumber(value, options = {}) {
        const {
            fieldName = '값',
            min = null,
            max = null,
            integer = false
        } = options;

        const numValue = Number(value);

        if (isNaN(numValue)) {
            return { isValid: false, message: `${fieldName}은(는) 숫자여야 합니다.` };
        }

        if (integer && !Number.isInteger(numValue)) {
            return { isValid: false, message: `${fieldName}은(는) 정수여야 합니다.` };
        }

        if (min !== null && numValue < min) {
            return { isValid: false, message: `${fieldName}은(는) ${min} 이상이어야 합니다.` };
        }

        if (max !== null && numValue > max) {
            return { isValid: false, message: `${fieldName}은(는) ${max} 이하여야 합니다.` };
        }

        return { isValid: true, message: '' };
    }

    /**
     * 날짜 검증
     * @param {string|Date} date
     * @param {object} options
     * @returns {object}
     */
    validateDate(date, options = {}) {
        const {
            fieldName = '날짜',
            minDate = null,
            maxDate = null,
            futureOnly = false,
            pastOnly = false
        } = options;

        if (!date) {
            return { isValid: false, message: `${fieldName}을(를) 선택해주세요.` };
        }

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            return { isValid: false, message: '올바른 날짜 형식이 아닙니다.' };
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (futureOnly && dateObj < now) {
            return { isValid: false, message: `${fieldName}은(는) 미래 날짜여야 합니다.` };
        }

        if (pastOnly && dateObj > now) {
            return { isValid: false, message: `${fieldName}은(는) 과거 날짜여야 합니다.` };
        }

        if (minDate && dateObj < new Date(minDate)) {
            return { isValid: false, message: `${fieldName}은(는) ${minDate} 이후여야 합니다.` };
        }

        if (maxDate && dateObj > new Date(maxDate)) {
            return { isValid: false, message: `${fieldName}은(는) ${maxDate} 이전이어야 합니다.` };
        }

        return { isValid: true, message: '' };
    }

    /**
     * XSS 방어를 위한 HTML 이스케이프
     * @param {string} text
     * @returns {string}
     */
    escapeHTML(text) {
        if (!text) return '';

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;'
        };

        return text.replace(/[&<>"'\/]/g, (char) => map[char]);
    }

    /**
     * SQL Injection 방어를 위한 문자열 정리
     * @param {string} text
     * @returns {string}
     */
    sanitizeSQL(text) {
        if (!text) return '';

        // NoSQL을 사용하므로 기본적인 정리만 수행
        return text.replace(/['";\\]/g, '');
    }

    /**
     * 폼 전체 검증
     * @param {object} formData - {fieldName: value}
     * @param {object} rules - {fieldName: validationRule}
     * @returns {object} {isValid: boolean, errors: {}}
     */
    validateForm(formData, rules) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, value] of Object.entries(formData)) {
            const rule = rules[fieldName];

            if (!rule) continue;

            let result = { isValid: true, message: '' };

            switch (rule.type) {
                case 'email':
                    result = this.validateEmail(value);
                    break;
                case 'password':
                    result = this.validatePassword(value, rule.options);
                    break;
                case 'phone':
                    result = this.validatePhone(value);
                    break;
                case 'name':
                    result = this.validateName(value);
                    break;
                case 'text':
                    result = this.validateText(value, rule.options);
                    break;
                case 'number':
                    result = this.validateNumber(value, rule.options);
                    break;
                case 'date':
                    result = this.validateDate(value, rule.options);
                    break;
                case 'url':
                    result = this.validateURL(value);
                    break;
                case 'file':
                    result = this.validateFile(value, rule.options);
                    break;
                default:
                    console.warn(`Unknown validation type: ${rule.type}`);
            }

            if (!result.isValid) {
                errors[fieldName] = result.message;
                isValid = false;
            }
        }

        return { isValid, errors };
    }
}

// 전역 인스턴스 생성
const validationUtils = new ValidationUtils();
