// URL 새니타이저 유틸리티
// XSS 및 인젝션 공격을 방지하기 위한 URL 검증 및 새니타이징

class URLSanitizer {
    constructor() {
        // 허용된 프로토콜
        this.allowedProtocols = ['http:', 'https:'];

        // 위험한 프로토콜 패턴
        this.dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
    }

    /**
     * URL을 검증하고 새니타이즈
     * @param {string} url - 검증할 URL
     * @param {object} options - 옵션 설정
     * @returns {string|null} - 안전한 URL 또는 null
     */
    sanitize(url, options = {}) {
        const {
            allowData = false,  // data: URL 허용 여부 (이미지 등)
            allowRelative = false,  // 상대 경로 허용 여부
            requireHttps = false  // HTTPS 강제 여부
        } = options;

        if (!url || typeof url !== 'string') {
            return null;
        }

        // 공백 제거
        url = url.trim();

        if (url.length === 0) {
            return null;
        }

        // 위험한 프로토콜 검사
        if (this.dangerousProtocols.test(url)) {
            console.warn('위험한 프로토콜이 감지되었습니다:', url);
            return null;
        }

        // 상대 경로 처리
        if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            if (allowRelative) {
                return url;
            } else {
                console.warn('상대 경로는 허용되지 않습니다:', url);
                return null;
            }
        }

        // data: URL 처리 (Base64 인코딩된 이미지 등)
        if (url.startsWith('data:')) {
            if (allowData) {
                // data:image/* 또는 data:video/* 만 허용
                if (/^data:(image|video)\/[a-zA-Z0-9+\-]+;base64,/.test(url)) {
                    return url;
                }
            }
            console.warn('data: URL이 허용되지 않거나 형식이 올바르지 않습니다:', url.substring(0, 50));
            return null;
        }

        // 절대 URL 검증
        try {
            const parsed = new URL(url);

            // 프로토콜 검증
            if (!this.allowedProtocols.includes(parsed.protocol)) {
                console.warn('허용되지 않은 프로토콜:', parsed.protocol);
                return null;
            }

            // HTTPS 강제
            if (requireHttps && parsed.protocol !== 'https:') {
                console.warn('HTTPS가 필요합니다:', url);
                return null;
            }

            // 유효한 URL 반환
            return parsed.href;

        } catch (error) {
            console.warn('유효하지 않은 URL:', url, error.message);
            return null;
        }
    }

    /**
     * 이미지 URL 검증 (data: URL 허용)
     * @param {string} url - 이미지 URL
     * @returns {string|null}
     */
    sanitizeImageURL(url) {
        return this.sanitize(url, { allowData: true, allowRelative: true });
    }

    /**
     * 비디오 URL 검증 (data: URL 허용)
     * @param {string} url - 비디오 URL
     * @returns {string|null}
     */
    sanitizeVideoURL(url) {
        return this.sanitize(url, { allowData: true, allowRelative: false });
    }

    /**
     * 외부 링크 URL 검증 (HTTPS 강제)
     * @param {string} url - 외부 링크 URL
     * @returns {string|null}
     */
    sanitizeExternalURL(url) {
        return this.sanitize(url, { allowData: false, allowRelative: false, requireHttps: true });
    }

    /**
     * URL이 안전한지 검증만 수행 (boolean 반환)
     * @param {string} url
     * @returns {boolean}
     */
    isSafe(url) {
        return this.sanitize(url) !== null;
    }

    /**
     * HTML 속성에 안전하게 사용할 수 있도록 URL 이스케이프
     * @param {string} url
     * @returns {string}
     */
    escapeForHTML(url) {
        if (!url) return '';
        return url
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * URL의 파일 확장자 추출
     * @param {string} url
     * @returns {string|null}
     */
    getFileExtension(url) {
        try {
            const parsed = new URL(url);
            const pathname = parsed.pathname;
            const ext = pathname.split('.').pop().toLowerCase();
            return ext || null;
        } catch {
            return null;
        }
    }

    /**
     * 안전한 URL로 이미지 태그 생성
     * @param {string} url - 이미지 URL
     * @param {string} alt - 대체 텍스트
     * @param {string} className - CSS 클래스
     * @returns {string} - HTML 문자열
     */
    createSafeImageTag(url, alt = '', className = '') {
        const safeURL = this.sanitizeImageURL(url);
        if (!safeURL) {
            return `<img src="/images/placeholder.png" alt="이미지를 불러올 수 없습니다" class="${className}">`;
        }

        const safeAlt = alt.replace(/"/g, '&quot;');
        const escapedURL = this.escapeForHTML(safeURL);

        return `<img src="${escapedURL}" alt="${safeAlt}" class="${className}" onerror="this.src='/images/placeholder.png'">`;
    }

    /**
     * 안전한 URL로 비디오 태그 생성
     * @param {string} url - 비디오 URL
     * @param {object} options - 비디오 옵션
     * @returns {string} - HTML 문자열
     */
    createSafeVideoTag(url, options = {}) {
        const safeURL = this.sanitizeVideoURL(url);
        if (!safeURL) {
            return '<p style="color: red;">비디오를 불러올 수 없습니다.</p>';
        }

        const {
            controls = true,
            autoplay = false,
            loop = false,
            muted = false,
            width = '100%',
            className = ''
        } = options;

        const escapedURL = this.escapeForHTML(safeURL);
        const attrs = [
            controls ? 'controls' : '',
            autoplay ? 'autoplay' : '',
            loop ? 'loop' : '',
            muted ? 'muted' : ''
        ].filter(Boolean).join(' ');

        return `<video src="${escapedURL}" ${attrs} width="${width}" class="${className}">
            브라우저가 비디오 재생을 지원하지 않습니다.
        </video>`;
    }
}

// 전역 인스턴스 생성
const urlSanitizer = new URLSanitizer();

// 전역 헬퍼 함수
window.sanitizeURL = (url, options) => urlSanitizer.sanitize(url, options);
window.sanitizeImageURL = (url) => urlSanitizer.sanitizeImageURL(url);
window.sanitizeVideoURL = (url) => urlSanitizer.sanitizeVideoURL(url);
window.isSafeURL = (url) => urlSanitizer.isSafe(url);
