// 로딩 인디케이터 유틸리티

class LoadingIndicator {
    constructor() {
        this.loadingElement = null;
        this.createLoadingElement();
    }

    createLoadingElement() {
        // 로딩 오버레이 생성
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'global-loading-indicator';
        this.loadingElement.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            justify-content: center;
            align-items: center;
        `;

        // 로딩 스피너
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 60px;
            height: 60px;
            border: 6px solid #f3f3f3;
            border-top: 6px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        // 로딩 텍스트
        const loadingText = document.createElement('div');
        loadingText.id = 'loading-text';
        loadingText.style.cssText = `
            color: white;
            font-size: 16px;
            margin-top: 20px;
            text-align: center;
        `;
        loadingText.textContent = '로딩 중...';

        // 컨테이너
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        container.appendChild(spinner);
        container.appendChild(loadingText);

        this.loadingElement.appendChild(container);

        // CSS 애니메이션 추가
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // DOM에 추가
        document.body.appendChild(this.loadingElement);
    }

    /**
     * 로딩 인디케이터 표시
     * @param {string} message - 표시할 메시지 (선택)
     */
    show(message = '로딩 중...') {
        if (this.loadingElement) {
            const loadingText = this.loadingElement.querySelector('#loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            this.loadingElement.style.display = 'flex';
        }
    }

    /**
     * 로딩 인디케이터 숨김
     */
    hide() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    /**
     * 비동기 함수 실행 시 자동으로 로딩 표시
     * @param {Promise} promise
     * @param {string} message
     * @returns {Promise}
     */
    async wrap(promise, message = '처리 중...') {
        this.show(message);
        try {
            const result = await promise;
            return result;
        } finally {
            this.hide();
        }
    }
}

// 전역 인스턴스 생성
const loadingIndicator = new LoadingIndicator();

// 전역 헬퍼 함수
window.showLoading = (message) => loadingIndicator.show(message);
window.hideLoading = () => loadingIndicator.hide();
window.withLoading = (promise, message) => loadingIndicator.wrap(promise, message);
