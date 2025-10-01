// 파일 검증 유틸리티
// 파일 타입, 크기, 매직 바이트(파일 시그니처) 검증

class FileValidator {
    constructor() {
        // 파일 시그니처 (매직 바이트) 정의
        this.signatures = {
            // 이미지 파일
            'image/jpeg': {
                extensions: ['jpg', 'jpeg'],
                signatures: [
                    [0xFF, 0xD8, 0xFF]  // JPEG 시작
                ]
            },
            'image/png': {
                extensions: ['png'],
                signatures: [
                    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]  // PNG 시그니처
                ]
            },
            'image/gif': {
                extensions: ['gif'],
                signatures: [
                    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],  // GIF87a
                    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]   // GIF89a
                ]
            },
            'image/webp': {
                extensions: ['webp'],
                signatures: [
                    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]  // RIFF....WEBP
                ]
            },

            // 비디오 파일
            'video/mp4': {
                extensions: ['mp4', 'm4v'],
                signatures: [
                    [null, null, null, null, 0x66, 0x74, 0x79, 0x70],  // ....ftyp (위치 4-7)
                    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]   // 일반적인 MP4
                ]
            },
            'video/webm': {
                extensions: ['webm'],
                signatures: [
                    [0x1A, 0x45, 0xDF, 0xA3]  // WebM/Matroska
                ]
            },
            'video/x-matroska': {
                extensions: ['mkv'],
                signatures: [
                    [0x1A, 0x45, 0xDF, 0xA3]
                ]
            },
            'video/ogg': {
                extensions: ['ogv', 'ogg'],
                signatures: [
                    [0x4F, 0x67, 0x67, 0x53]  // OggS
                ]
            },
            'video/quicktime': {
                extensions: ['mov'],
                signatures: [
                    [null, null, null, null, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74]  // ....ftypqt
                ]
            }
        };

        // 파일 크기 제한 (바이트)
        this.maxFileSizes = {
            image: 10 * 1024 * 1024,      // 10MB
            video: 50 * 1024 * 1024,      // 50MB (Firebase Storage)
            videoLocal: 5 * 1024 * 1024   // 5MB (localStorage Base64)
        };
    }

    /**
     * 파일 확장자 추출
     * @param {string} filename
     * @returns {string|null}
     */
    getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') return null;
        const parts = filename.split('.');
        if (parts.length < 2) return null;
        return parts.pop().toLowerCase();
    }

    /**
     * MIME 타입이 허용된 확장자와 일치하는지 검증
     * @param {string} mimeType
     * @param {string} extension
     * @returns {boolean}
     */
    isExtensionValid(mimeType, extension) {
        const signatureInfo = this.signatures[mimeType];
        if (!signatureInfo) return false;
        return signatureInfo.extensions.includes(extension);
    }

    /**
     * 파일의 매직 바이트 검증
     * @param {Uint8Array} bytes - 파일의 첫 바이트들
     * @param {string} mimeType - 예상 MIME 타입
     * @returns {boolean}
     */
    checkSignature(bytes, mimeType) {
        const signatureInfo = this.signatures[mimeType];
        if (!signatureInfo) {
            console.warn('알 수 없는 MIME 타입:', mimeType);
            return false;
        }

        // 모든 시그니처 패턴 확인
        return signatureInfo.signatures.some(signature => {
            return signature.every((byte, index) => {
                // null은 와일드카드 (모든 값 허용)
                if (byte === null) return true;
                return bytes[index] === byte;
            });
        });
    }

    /**
     * 파일 시그니처를 읽어서 검증
     * @param {File} file
     * @returns {Promise<Object>} - {isValid, error, mimeType}
     */
    async validateFileSignature(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const bytes = new Uint8Array(e.target.result);

                    // MIME 타입 검증
                    const isSignatureValid = this.checkSignature(bytes, file.type);

                    if (!isSignatureValid) {
                        resolve({
                            isValid: false,
                            error: '파일 형식이 올바르지 않습니다. 파일이 손상되었거나 확장자가 변경되었을 수 있습니다.',
                            mimeType: file.type
                        });
                        return;
                    }

                    resolve({
                        isValid: true,
                        mimeType: file.type
                    });

                } catch (error) {
                    resolve({
                        isValid: false,
                        error: '파일을 읽는 중 오류가 발생했습니다: ' + error.message
                    });
                }
            };

            reader.onerror = () => {
                resolve({
                    isValid: false,
                    error: '파일을 읽을 수 없습니다.'
                });
            };

            // 처음 12바이트만 읽기 (대부분의 시그니처는 처음 몇 바이트에 있음)
            const blob = file.slice(0, 12);
            reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * 종합 파일 검증
     * @param {File} file
     * @param {Object} options
     * @returns {Promise<Object>} - {isValid, errors}
     */
    async validate(file, options = {}) {
        const {
            allowedTypes = [],  // 허용된 MIME 타입 배열
            maxSize = null,     // 최대 파일 크기 (바이트)
            checkSignature = true  // 시그니처 검증 여부
        } = options;

        const errors = [];

        // 1. 파일 존재 확인
        if (!file) {
            return {
                isValid: false,
                errors: ['파일이 선택되지 않았습니다.']
            };
        }

        // 2. MIME 타입 확인
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            errors.push(`허용되지 않은 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`);
        }

        // 3. 파일 확장자와 MIME 타입 일치 확인
        const extension = this.getFileExtension(file.name);
        if (extension && file.type) {
            if (!this.isExtensionValid(file.type, extension)) {
                errors.push(`파일 확장자(${extension})와 파일 형식(${file.type})이 일치하지 않습니다.`);
            }
        }

        // 4. 파일 크기 확인
        if (maxSize && file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            errors.push(`파일 크기(${fileSizeMB}MB)가 제한(${maxSizeMB}MB)을 초과했습니다.`);
        }

        // 5. 파일 시그니처 검증 (매직 바이트)
        if (checkSignature && errors.length === 0) {
            const signatureResult = await this.validateFileSignature(file);
            if (!signatureResult.isValid) {
                errors.push(signatureResult.error);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                extension: extension
            }
        };
    }

    /**
     * 이미지 파일 검증
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async validateImage(file) {
        return this.validate(file, {
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxSize: this.maxFileSizes.image,
            checkSignature: true
        });
    }

    /**
     * 비디오 파일 검증 (Firebase 업로드용)
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async validateVideo(file) {
        return this.validate(file, {
            allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'],
            maxSize: this.maxFileSizes.video,
            checkSignature: true
        });
    }

    /**
     * 비디오 파일 검증 (localStorage Base64용 - 더 작은 제한)
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async validateVideoLocal(file) {
        return this.validate(file, {
            allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
            maxSize: this.maxFileSizes.videoLocal,
            checkSignature: true
        });
    }

    /**
     * 사용자 친화적인 에러 메시지 생성
     * @param {Array<string>} errors
     * @returns {string}
     */
    formatErrors(errors) {
        if (errors.length === 0) return '';
        if (errors.length === 1) return errors[0];
        return '다음 문제가 발견되었습니다:\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
    }
}

// 전역 인스턴스 생성
const fileValidator = new FileValidator();

// 전역 헬퍼 함수
window.validateImage = (file) => fileValidator.validateImage(file);
window.validateVideo = (file) => fileValidator.validateVideo(file);
window.validateVideoLocal = (file) => fileValidator.validateVideoLocal(file);
