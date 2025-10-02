// LMS 시스템 JavaScript

class LMSSystem {
    constructor() {
        this.isFirebaseReady = false;
        this.checkFirebaseStatus();
        this.settings = this.getDefaultSettings();
        this.courses = [];

        this.users = [];
        this.currentUser = null;
        this.enrollments = [];

        // Firebase 리스너 unsubscribe 함수 저장
        this.unsubscribers = [];

        // DOM 이벤트 리스너 추적
        this.eventListeners = [];

        this.initializeWithFirebase();
    }

    async initializeWithFirebase() {
        try {
            // 로딩 표시
            if (typeof showLoading !== 'undefined') {
                showLoading('시스템 초기화 중...');
            }

            // Firebase 서비스 준비 대기
            await firebaseService.waitForFirebase();
            this.isFirebaseReady = firebaseService.isFirebaseReady;

            // 데이터 로드
            await this.loadData();

            // 일반 초기화
            this.init();
        } finally {
            // 로딩 숨김
            if (typeof hideLoading !== 'undefined') {
                // 약간의 지연 후 숨김 (사용자 경험 개선)
                setTimeout(() => hideLoading(), 300);
            }
        }
    }

    // 고유 ID 생성 (UUID v4 간소화 버전)
    generateUniqueId() {
        return Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    }

    async loadData() {
        try {
            // Firebase에서 데이터 로드 (페이지네이션 사용)
            if (this.isFirebaseReady) {
                console.log('🔥 Firebase에서 데이터 로드 시작...');

                // 일반 사용자: 첫 페이지만 로드 (50개)
                // 관리자: getAllCourses() 사용 권장
                const [coursesResult, enrollmentsResult, settings] = await Promise.all([
                    firebaseService.getCourses({ limit: 50 }),
                    firebaseService.getEnrollments({
                        limit: 100,
                        userId: this.currentUser?.id  // 본인 수강신청만
                    }),
                    firebaseService.getSettings()
                ]);

                // 페이지네이션 결과 처리
                const courses = coursesResult.courses || coursesResult;
                const enrollments = enrollmentsResult.enrollments || enrollmentsResult;

                console.log(`📚 로드된 강좌 수: ${courses.length}`);
                console.log(`🎓 로드된 수강신청 수: ${enrollments.length}`);
                console.log(`⚙️ 로드된 설정:`, settings);

                // 다음 페이지 로드를 위한 커서 저장
                this.coursesLastDoc = coursesResult.lastDoc;
                this.enrollmentsLastDoc = enrollmentsResult.lastDoc;
                this.hasMoreCourses = coursesResult.hasMore;

                // Firebase에서 강좌 데이터가 없으면 기본 데이터 사용
                if (courses.length === 0) {
                    console.log('⚠️ 강좌 데이터 없음 - 기본 강좌 초기화');
                    await this.initializeDefaultCourses();
                } else {
                    this.courses = courses;
                    console.log('✅ Firebase 강좌 데이터 로드 완료');
                }

                this.enrollments = enrollments;
                this.currentUser = await firebaseService.getCurrentUser();

                // 설정 적용
                if (settings) {
                    this.settings = { ...this.getDefaultSettings(), ...settings };
                    console.log('✅ Firebase 설정 데이터 로드 및 적용 완료');
                } else {
                    console.log('⚠️ 설정 데이터 없음 - 기본 설정 사용');
                }
                this.applySettings();

                // 실시간 리스너 설정
                this.setupFirebaseListeners();
            } else {
                console.log('💾 Firebase 비활성화 - localStorage 사용');
                // 로컬 스토리지 폴백 (안전한 JSON 파싱)
                this.users = this.safeParseJSON(localStorage.getItem('lms_users'), this.getDefaultUsers());
                this.currentUser = this.safeParseJSON(localStorage.getItem('lms_current_user'), null);
                this.enrollments = this.safeParseJSON(localStorage.getItem('lms_enrollments'), []);

                // 설정 로드 및 적용
                const localSettings = this.safeParseJSON(localStorage.getItem('lms_settings'), {});
                this.settings = { ...this.getDefaultSettings(), ...localSettings };
                console.log('💾 로컬 설정 로드 완료:', this.settings);
                this.applySettings();
            }

            // 강좌 렌더링
            this.renderCourses();

        } catch (error) {
            console.error('데이터 로드 오류:', error);
            // 오류 시 로컬 스토리지 사용 (안전한 JSON 파싱)
            this.users = this.safeParseJSON(localStorage.getItem('lms_users'), this.getDefaultUsers());
            this.currentUser = this.safeParseJSON(localStorage.getItem('lms_current_user'), null);
            this.enrollments = this.safeParseJSON(localStorage.getItem('lms_enrollments'), []);

            // 설정도 로컬에서 로드
            const localSettings = this.safeParseJSON(localStorage.getItem('lms_settings'), {});
            this.settings = { ...this.getDefaultSettings(), ...localSettings };
            console.log('❌ 오류 시 로컬 설정 로드:', this.settings);
            this.applySettings();

            this.renderCourses();
        }
    }

    // 안전한 JSON 파싱 헬퍼 함수
    safeParseJSON(jsonString, fallback) {
        try {
            return jsonString ? JSON.parse(jsonString) : fallback;
        } catch (error) {
            console.error('JSON 파싱 오류:', error);
            return fallback;
        }
    }

    async initializeDefaultCourses() {
        // 기본 강좌 데이터를 Firebase에 저장
        for (const course of this.courses) {
            await firebaseService.saveCourse(course);
        }
    }

    init() {
        this.renderCourses();
        this.bindEvents();
        this.updateAuthUI();
        this.handleNavigation();
        this.loadMyCoursesIfLoggedIn();
    }

    bindEvents() {
        // 네비게이션 이벤트
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });

        // 강좌 검색 이벤트
        const searchInput = document.getElementById('course-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCourses();
            });
        }

        // 카테고리 필터 이벤트
        const categoryFilter = document.getElementById('course-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filterCourses();
            });
        }

        // 난이도 필터 이벤트
        const levelFilter = document.getElementById('course-level-filter');
        if (levelFilter) {
            levelFilter.addEventListener('change', () => {
                this.filterCourses();
            });
        }

        // 필터 버튼 이벤트 제거됨 (카테고리 삭제)

        // 폼 제출 이벤트
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }

        const passwordResetForm = document.getElementById('password-reset-form');
        if (passwordResetForm) {
            passwordResetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset(e);
            });
        }

        document.querySelector('.contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactForm(e);
        });

        document.querySelector('.enrollment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEnrollment(e);
        });

        // 모달 외부 클릭 이벤트
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    filterCourses() {
        const searchInput = document.getElementById('course-search-input');
        const categoryFilter = document.getElementById('course-category-filter');
        const levelFilter = document.getElementById('course-level-filter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        const selectedLevel = levelFilter ? levelFilter.value : '';

        const filteredCourses = this.courses.filter(course => {
            // 검색어 필터 (강좌명 또는 강사명)
            const matchesSearch = !searchTerm ||
                course.title.toLowerCase().includes(searchTerm) ||
                course.instructor.toLowerCase().includes(searchTerm);

            // 카테고리 필터
            const matchesCategory = !selectedCategory || course.category === selectedCategory;

            // 난이도 필터
            const matchesLevel = !selectedLevel || course.level === selectedLevel;

            return matchesSearch && matchesCategory && matchesLevel;
        });

        this.renderCourses(filteredCourses);
    }

    renderCourses(coursesToRender = this.courses) {
        const coursesGrid = document.getElementById('courses-grid');

        if (coursesToRender.length === 0) {
            coursesGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #6c757d;">해당하는 강좌가 없습니다.</p>';
            return;
        }

        // XSS 방지: 사용자 입력 이스케이프
        const escapeHtml = (text) => {
            const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
            return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
        };

        coursesGrid.innerHTML = coursesToRender.map(course => {
            const safeTitle = escapeHtml(course.title);
            const safeInstructor = escapeHtml(course.instructor);
            // URL 새니타이즈 적용
            const sanitizedThumbnail = course.thumbnail && typeof urlSanitizer !== 'undefined'
                ? urlSanitizer.sanitizeImageURL(course.thumbnail)
                : course.thumbnail;

            return `
                <div class="course-card" onclick="lms.showCourseDetail(${course.id})">
                    <div class="course-image">
                        ${sanitizedThumbnail
                            ? `<img src="${escapeHtml(sanitizedThumbnail)}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover;">`
                            : '<div class="placeholder-image">강좌 썸네일</div>'
                        }
                    </div>
                    <div class="course-content">
                        <h3 class="course-title">${safeTitle}</h3>
                        <p class="course-instructor">강사: ${safeInstructor}</p>
                        <div class="course-footer">
                            <span class="course-badge" style="background: #28a745; color: white; padding: 5px 12px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">무료</span>
                            <div class="course-rating">
                                <span>⭐ ${course.rating}</span>
                                <span>(${course.students})</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 카테고리 관련 함수 제거됨

    showSection(sectionId) {
        // 모든 섹션 숨기기
        document.querySelectorAll('main > section').forEach(section => {
            section.style.display = 'none';
        });

        // 선택된 섹션 보이기
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // 네비게이션 활성 상태 변경
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // "내 강좌" 섹션일 경우 강좌 목록 로드
        if (sectionId === 'my-courses' && this.currentUser) {
            console.log('📖 "내 강좌" 섹션 활성화 - loadMyCourses() 호출');
            this.loadMyCourses();
        }

        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleNavigation() {
        // 초기 섹션 표시
        this.showSection('home');
    }

    showCourseDetail(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        // 모달 내용 업데이트
        document.getElementById('course-title').textContent = course.title;
        document.getElementById('course-instructor').textContent = course.instructor;
        document.getElementById('course-duration').textContent = course.duration;
        document.getElementById('course-level').textContent = course.level;
        document.getElementById('course-description-text').textContent = course.description;

        // 커리큘럼 렌더링
        const curriculumList = document.getElementById('course-curriculum-list');
        curriculumList.innerHTML = course.curriculum.map(item => `<li>${item}</li>`).join('');

        // 수강신청 버튼에 강좌 ID 저장
        const enrollBtn = document.querySelector('#course-detail-modal .btn-primary');
        enrollBtn.setAttribute('data-course-id', courseId);

        // 모달 표시
        document.getElementById('course-detail-modal').style.display = 'block';
    }

    showLogin() {
        this.closeAllModals();
        document.getElementById('login-modal').style.display = 'block';
    }

    showRegister() {
        this.closeAllModals();
        document.getElementById('register-modal').style.display = 'block';
    }

    showPasswordReset() {
        this.closeAllModals();
        document.getElementById('password-reset-modal').style.display = 'block';
        // 폼 리셋 및 성공 메시지 숨김
        document.getElementById('password-reset-form').style.display = 'block';
        document.getElementById('reset-success').style.display = 'none';
        document.getElementById('reset-email').value = '';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // 이 함수는 더 이상 사용하지 않음 - 최신 handleLogin 함수로 대체됨
    // 하위 호환성을 위해 남겨둠

    // 이 함수는 더 이상 사용하지 않음 - 최신 handleRegister 함수로 대체됨
    // 하위 호환성을 위해 남겨둠

    handleContactForm(e) {
        alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
        e.target.reset();
    }

    updateAuthUI() {
        const authButtons = document.querySelector('.auth-buttons');

        if (this.currentUser) {
            authButtons.innerHTML = `
                <span style="color: #007bff; font-weight: 500;">${this.currentUser.name}님</span>
                <button class="btn btn-outline" onclick="lms.logout()">로그아웃</button>
            `;
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline" onclick="lms.showLogin()">로그인</button>
                <button class="btn btn-primary" onclick="lms.showRegister()">회원가입</button>
            `;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('lms_current_user');
        this.updateAuthUI();
        alert('로그아웃되었습니다.');
    }

    enrollCourse() {
        if (!this.currentUser) {
            alert('로그인이 필요합니다.');
            this.showLogin();
            return;
        }

        const courseId = parseInt(document.querySelector('#course-detail-modal .btn-primary').getAttribute('data-course-id'));
        const course = this.courses.find(c => c.id === courseId);

        if (!course) return;

        // 이미 수강중인지 확인
        console.log('🔍 수강신청 중복 체크 중...');
        console.log('현재 사용자 ID:', this.currentUser.id);
        console.log('강좌 ID:', courseId);
        console.log('전체 수강신청:', this.enrollments.length, '개');
        console.log('수강신청 목록:', this.enrollments.map(e => ({
            enrollmentId: e.id,
            userId: e.userId,
            courseId: e.courseId,
            userMatch: e.userId === this.currentUser.id,
            courseMatch: e.courseId === courseId
        })));

        const isEnrolled = this.enrollments.find(e => e.userId === this.currentUser.id && e.courseId === courseId);
        console.log('중복 체크 결과:', isEnrolled ? '이미 수강중' : '수강 가능');

        if (isEnrolled) {
            console.log('❌ 중복된 수강신청:', isEnrolled);
            alert('이미 수강중인 강좌입니다.');
            return;
        }

        // 수강신청 모달에 정보 설정
        document.getElementById('enrollment-course-title').textContent = course.title;
        document.getElementById('enrollment-instructor').textContent = course.instructor;

        // 수강신청 모달 표시
        this.closeModal('course-detail-modal');
        document.getElementById('enrollment-modal').style.display = 'block';
    }

    async handleEnrollment(e) {
        const courseId = parseInt(document.querySelector('#course-detail-modal .btn-primary').getAttribute('data-course-id'));
        const agreeTerms = e.target.querySelector('input[type="checkbox"]').checked;

        if (!agreeTerms) {
            alert('수강 약관에 동의해주세요.');
            return;
        }

        // Rate limiting 체크
        if (typeof rateLimiter !== 'undefined') {
            const limitCheck = rateLimiter.checkLimit('enrollment', this.currentUser.id);
            if (!limitCheck.allowed) {
                alert(limitCheck.message);
                return;
            }
        }

        // 수강신청 정보 저장 (ID는 Firebase가 자동 생성하거나 UUID 사용)
        const enrollment = {
            // ID는 Firebase에서 자동 생성하거나, localStorage에서 고유 ID 생성
            id: this.isFirebaseReady ? null : this.generateUniqueId(),
            userId: this.currentUser.id,
            courseId: courseId,
            paymentMethod: 'free',  // 무료 강좌
            enrolledAt: new Date().toISOString(),
            status: 'enrolled',
            progress: 0
        };

        try {
            // Firebase에 수강신청 저장
            const result = await firebaseService.saveEnrollment(enrollment);

            if (result.success) {
                // Firebase가 생성한 ID 사용
                enrollment.id = result.enrollmentId || enrollment.id;
                this.enrollments.push(enrollment);

                // Rate limiter 성공 기록
                if (typeof rateLimiter !== 'undefined') {
                    rateLimiter.recordAttempt('enrollment', this.currentUser.id, true);
                }

                // 내 강좌 목록 새로고침
                await this.loadMyCourses();

                alert('수강신청이 완료되었습니다!');
                this.closeModal('enrollment-modal');

            } else if (result.isDuplicate) {
                // 중복 수강신청
                alert(result.error || '이미 수강신청한 강좌입니다.');
                this.closeModal('enrollment-modal');

            } else if (!this.isFirebaseReady) {
                // Firebase 없을 때 로컬 저장
                this.enrollments.push(enrollment);

                // 로컬 스토리지에도 백업 저장 (Firebase 실패 시 대비)
                if (!this.isFirebaseReady) {
                    localStorage.setItem('lms_enrollments', JSON.stringify(this.enrollments));
                }

                // Rate limiter 성공 기록
                if (typeof rateLimiter !== 'undefined') {
                    rateLimiter.recordAttempt('enrollment', this.currentUser.id, true);
                }

                // 내 강좌 목록 새로고침
                await this.loadMyCourses();

                alert('수강신청이 완료되었습니다!');
                this.closeModal('enrollment-modal');
            } else {
                // Rate limiter 실패 기록
                if (typeof rateLimiter !== 'undefined') {
                    rateLimiter.recordAttempt('enrollment', this.currentUser.id, false);
                }

                alert('수강신청 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('수강신청 오류:', error);

            // Rate limiter 실패 기록
            if (typeof rateLimiter !== 'undefined') {
                rateLimiter.recordAttempt('enrollment', this.currentUser.id, false);
            }

            alert('수강신청 중 오류가 발생했습니다.');
        }
    }

    addToWishlist() {
        if (!this.currentUser) {
            alert('로그인이 필요합니다.');
            this.showLogin();
            return;
        }

        alert('찜 목록에 추가되었습니다!');
    }

    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        const myCoursesNav = document.getElementById('my-courses-nav');

        if (this.currentUser) {
            // 로그인된 상태
            authButtons.style.display = 'none';
            userInfo.style.display = 'block';
            myCoursesNav.style.display = 'block';
            document.getElementById('user-name-display').textContent = this.currentUser.name;
        } else {
            // 로그아웃된 상태
            authButtons.style.display = 'block';
            userInfo.style.display = 'none';
            myCoursesNav.style.display = 'none';
        }
    }

    loadMyCoursesIfLoggedIn() {
        if (this.currentUser) {
            this.loadMyCourses();
        }
    }

    loadMyCourses() {
        const enrolledCoursesContainer = document.getElementById('enrolled-courses');
        const emptyCoursesContainer = document.getElementById('empty-courses');

        if (!this.currentUser) {
            return;
        }

        console.log('🔍 내 강좌 로딩 중...');
        console.log('현재 사용자 ID:', this.currentUser.id, '(타입:', typeof this.currentUser.id, ')');
        console.log('현재 사용자 이메일:', this.currentUser.email);
        console.log('전체 수강신청 수:', this.enrollments.length);
        console.log('전체 수강신청 목록:', this.enrollments.map(e => ({
            enrollmentId: e.id,
            userId: e.userId,
            userIdType: typeof e.userId,
            courseId: e.courseId,
            status: e.status,
            matches: String(e.userId) === String(this.currentUser.id)
        })));

        // 현재 사용자의 수강신청 목록 가져오기
        // 타입 차이 대응: 문자열 비교 사용 (Firebase uid는 문자열, localStorage id는 숫자일 수 있음)
        // status 조건 제거 또는 유연하게 처리 (undefined일 수 있음)
        const userEnrollments = this.enrollments.filter(e => {
            const userIdMatch = String(e.userId) === String(this.currentUser.id);
            const statusOk = !e.status || e.status === 'enrolled' || e.status === 'active';
            return userIdMatch && statusOk;
        });

        console.log('필터링된 내 수강신청:', userEnrollments.length, '개');
        console.log('매칭 결과:', this.enrollments.map(e => ({
            enrollmentUserId: e.userId,
            currentUserId: this.currentUser.id,
            match: e.userId === this.currentUser.id
        })));

        if (userEnrollments.length === 0) {
            enrolledCoursesContainer.style.display = 'none';
            emptyCoursesContainer.style.display = 'block';
            return;
        }

        enrolledCoursesContainer.style.display = 'block';
        emptyCoursesContainer.style.display = 'none';

        // 성능 최적화: Course Map 생성 (O(n) → O(1) 조회)
        const courseMap = new Map(this.courses.map(c => [c.id, c]));

        // 수강중인 강좌들 렌더링 (최적화됨)
        const enrolledCourseIds = new Set(userEnrollments.map(e => e.courseId));
        const enrolledCourses = Array.from(enrolledCourseIds)
            .map(courseId => courseMap.get(courseId))
            .filter(course => course); // null 값 제거

        const renderedHtml = this.renderMyCoursesGrid(enrolledCourses);
        enrolledCoursesContainer.innerHTML = renderedHtml;
    }

    renderMyCoursesGrid(courses) {
        // 성능 최적화: 진도율 Map 미리 계산
        const progressMap = new Map();
        this.enrollments
            .filter(e => e.userId === this.currentUser.id)
            .forEach(e => {
                const currentProgress = progressMap.get(e.courseId) || 0;
                progressMap.set(e.courseId, Math.max(currentProgress, e.progress || 0));
            });

        return `
            <div class="my-courses-grid">
                ${courses.map(course => {
                    // Map에서 O(1)로 진도율 조회
                    const progress = progressMap.get(course.id) || 0;

                    // URL 새니타이즈 적용
                    const sanitizedThumbnail = course.thumbnail && typeof urlSanitizer !== 'undefined'
                        ? urlSanitizer.sanitizeImageURL(course.thumbnail)
                        : course.thumbnail;
                    const safeTitle = this.escapeHtml(course.title);
                    const safeInstructor = this.escapeHtml(course.instructor);

                    return `
                        <div class="my-course-card">
                            <div class="course-thumbnail">
                                ${sanitizedThumbnail
                                    ? `<img src="${this.escapeHtml(sanitizedThumbnail)}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">`
                                    : `<div class="placeholder-image"><span>강좌 썸네일</span></div>`
                                }
                                <div class="course-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress}%"></div>
                                    </div>
                                    <span class="progress-text">${progress}% 완료</span>
                                </div>
                            </div>
                            <div class="course-content">
                                <h3 class="course-title">${safeTitle}</h3>
                                <p class="course-instructor">강사: ${safeInstructor}</p>
                                <div class="course-actions">
                                    <button class="btn btn-primary" onclick="continueLearning(${course.id})">학습 계속하기</button>
                                    <button class="btn btn-outline" onclick="viewCourseDetail(${course.id})">강좌 정보</button>
                                    ${progress >= 90 ? `<button class="btn btn-success" onclick="lms.generateCertificate(${course.id})">수강증 발급</button>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    async login(email, password) {
        console.log('📧 로그인 함수 시작:', { email, firebaseReady: this.isFirebaseReady });

        try {
            // Rate limiting 체크
            if (typeof rateLimiter !== 'undefined') {
                const limitCheck = rateLimiter.checkLimit('login', email);
                if (!limitCheck.allowed) {
                    alert(limitCheck.message);
                    return false;
                }
            }

            let loginResult = { success: false, user: null, method: null };

            // Firebase 로그인 시도
            if (this.isFirebaseReady && typeof firebaseService !== 'undefined') {
                console.log('🔥 Firebase 로그인 시도');
                try {
                    const result = await firebaseService.signIn(email, password);
                    if (result.success) {
                        loginResult = { ...result, method: 'Firebase' };
                        console.log('✅ Firebase 로그인 성공');
                    } else {
                        console.log('❌ Firebase 로그인 실패:', result.error);
                    }
                } catch (firebaseError) {
                    console.warn('Firebase 로그인 오류:', firebaseError);
                }
            }

            // Firebase 실패 시 localStorage 폴백
            if (!loginResult.success) {
                console.log('💾 localStorage 로그인 시도');

                // 사용자 찾기
                const foundUser = this.users.find(u => u.email === email);

                if (foundUser) {
                    console.log('사용자 발견:', { email: foundUser.email, authMethod: foundUser.authMethod });

                    // Firebase 등록 사용자인 경우
                    if (foundUser.authMethod === 'firebase') {
                        console.log('❌ Firebase 등록 사용자 - Firebase Authentication 필요');
                        console.log('Firebase가 비활성화되어 있거나 연결에 실패했습니다.');
                    }
                    // localStorage 등록 사용자인 경우
                    else if (foundUser.authMethod === 'localStorage' || !foundUser.authMethod) {
                        if (foundUser.password === password) {
                            loginResult = {
                                success: true,
                                user: foundUser,
                                method: 'localStorage'
                            };
                            console.log('✅ localStorage 로그인 성공');
                        } else {
                            console.log('❌ 비밀번호 불일치');
                        }
                    }
                } else {
                    console.log('❌ 등록되지 않은 이메일');

                    // 등록된 사용자 목록 디버깅
                    console.log('등록된 사용자 수:', this.users.length);
                    console.log('사용자 이메일 목록:', this.users.map(u => u.email));
                }
            }

            // 로그인 성공 처리
            if (loginResult.success) {
                console.log(`🎉 로그인 성공 (${loginResult.method}):`, loginResult.user);

                this.currentUser = loginResult.user;

                // localStorage에 현재 사용자 저장 (동기화)
                try {
                    localStorage.setItem('lms_current_user', JSON.stringify(loginResult.user));
                    console.log('✅ 사용자 정보 localStorage 저장 완료');
                } catch (storageError) {
                    console.warn('localStorage 저장 실패:', storageError);
                }

                // Rate limiter 성공 기록
                if (typeof rateLimiter !== 'undefined') {
                    rateLimiter.recordAttempt('login', email, true);
                }

                // 로그인 후 수강신청 데이터 다시 로드 (Firebase)
                if (this.isFirebaseReady) {
                    console.log('🔄 로그인 후 수강신청 데이터 로드 중...');
                    try {
                        const enrollmentsResult = await firebaseService.getEnrollments({
                            limit: 100,
                            userId: this.currentUser.id
                        });
                        this.enrollments = enrollmentsResult.enrollments || enrollmentsResult;
                        console.log(`✅ ${this.enrollments.length}개의 수강신청 데이터 로드 완료`);
                    } catch (error) {
                        console.error('수강신청 데이터 로드 실패:', error);
                    }
                }

                this.updateAuthUI();
                await this.loadMyCourses();
                this.closeAllModals();

                alert(`로그인되었습니다! (${loginResult.method})`);
                return true;

            } else {
                console.log('❌ 모든 로그인 방법 실패');

                // Rate limiter 실패 기록
                if (typeof rateLimiter !== 'undefined') {
                    rateLimiter.recordAttempt('login', email, false);
                }

                // 사용자에게 구체적인 오류 정보 제공
                const foundUser = this.users.find(u => u.email === email);
                let errorMessage = '로그인에 실패했습니다.\n\n';

                if (foundUser) {
                    if (foundUser.authMethod === 'firebase') {
                        errorMessage += '이 계정은 Firebase로 등록되었습니다.\nFirebase 연결 상태를 확인해주세요.\n\n';
                        errorMessage += '해결방법:\n• 인터넷 연결 확인\n• 페이지 새로고침 후 재시도';
                    } else {
                        errorMessage += '비밀번호가 올바르지 않습니다.\n\n';
                        errorMessage += '다음을 확인해주세요:\n• 비밀번호가 정확한지\n• 대소문자가 맞는지\n• 공백이 포함되지 않았는지';
                    }
                } else {
                    errorMessage += '등록되지 않은 이메일입니다.\n\n';
                    errorMessage += '다음을 확인해주세요:\n• 이메일이 정확한지\n• 회원가입을 완료했는지';
                }

                alert(errorMessage);
                return false;
            }

        } catch (error) {
            console.error('로그인 전체 오류:', error);

            // Rate limiter 실패 기록
            if (typeof rateLimiter !== 'undefined') {
                rateLimiter.recordAttempt('login', email, false);
            }

            alert('로그인 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
            return false;
        }
    }

    async register(userData) {
        console.log('📝 회원가입 시작:', { email: userData.email, firebaseReady: this.isFirebaseReady });

        try {
            // Rate limiting 체크
            if (typeof rateLimiter !== 'undefined') {
                const limitCheck = rateLimiter.checkLimit('register', userData.email);
                if (!limitCheck.allowed) {
                    alert(limitCheck.message);
                    return false;
                }
            }

            let registrationResult = { success: false, user: null, method: null };

            // Firebase 회원가입 시도
            if (this.isFirebaseReady && typeof firebaseService !== 'undefined') {
                console.log('🔥 Firebase 회원가입 시도');
                try {
                    const result = await firebaseService.signUp(userData.email, userData.password, userData);
                    if (result.success) {
                        registrationResult = { ...result, method: 'Firebase' };
                        console.log('✅ Firebase 회원가입 성공');
                    } else {
                        console.log('❌ Firebase 회원가입 실패:', result.error);
                    }
                } catch (firebaseError) {
                    console.warn('Firebase 회원가입 오류:', firebaseError);
                }
            }

            // Firebase 실패 시 localStorage 폴백
            if (!registrationResult.success) {
                console.log('💾 localStorage 회원가입 시도');

                // 중복 이메일 확인
                const existingUser = this.users.find(u => u.email === userData.email);
                if (existingUser) {
                    console.log('❌ 이미 존재하는 이메일');
                    alert('이미 등록된 이메일입니다.');
                    return false;
                }

                // 로컬 회원가입
                const newUser = {
                    id: Date.now(),
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,
                    phone: userData.phone,
                    region: userData.region,
                    organization: userData.organization,
                    registeredAt: new Date().toISOString()
                };

                this.users.push(newUser);
                localStorage.setItem('lms_users', JSON.stringify(this.users));

                registrationResult = {
                    success: true,
                    user: newUser,
                    method: 'localStorage'
                };
                console.log('✅ localStorage 회원가입 성공');
            }

            // 회원가입 성공 처리
            if (registrationResult.success) {
                console.log(`🎉 회원가입 성공 (${registrationResult.method}):`, registrationResult.user);

                // localStorage에도 사용자 목록 업데이트 (동기화)
                if (registrationResult.method === 'Firebase') {
                    const currentUsers = JSON.parse(localStorage.getItem('lms_users') || '[]');
                    const existsInLocal = currentUsers.find(u => u.email === userData.email);

                    if (!existsInLocal) {
                        // Firebase 사용자 정보를 localStorage에 저장 (비밀번호 제외)
                        const syncUser = {
                            ...registrationResult.user,
                            authMethod: 'firebase',
                            registeredAt: new Date().toISOString()
                        };
                        currentUsers.push(syncUser);
                        localStorage.setItem('lms_users', JSON.stringify(currentUsers));
                        this.users = currentUsers;
                        console.log('✅ Firebase 사용자를 localStorage에 동기화');
                    }
                }

                // Rate limiter 성공 기록
                if (typeof rateLimiter !== 'undefined') {
                    rateLimiter.recordAttempt('register', userData.email, true);
                }

                alert(`회원가입이 완료되었습니다! (${registrationResult.method})`);
                this.closeAllModals();
                return true;

            } else {
                console.log('❌ 모든 회원가입 방법 실패');

                // Rate limiter 실패 기록
                if (typeof rateLimiter !== 'undefined') {
                    rateLimiter.recordAttempt('register', userData.email, false);
                }

                alert('회원가입에 실패했습니다. 다시 시도해주세요.');
                return false;
            }

        } catch (error) {
            console.error('회원가입 전체 오류:', error);

            // Rate limiter 실패 기록
            if (typeof rateLimiter !== 'undefined') {
                rateLimiter.recordAttempt('register', userData.email, false);
            }

            alert('회원가입 중 오류가 발생했습니다.');
            return false;
        }
    }

    async logout() {
        try {
            await firebaseService.signOut();
            this.currentUser = null;
            this.updateAuthUI();
            this.showSection('home');
            alert('로그아웃되었습니다.');
        } catch (error) {
            console.error('로그아웃 오류:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    }

    async handleLogin(e) {
        const email = e.target.querySelector('input[type="email"]').value.trim();
        const password = e.target.querySelector('input[type="password"]').value;

        // 디버깅 정보 로그
        console.log('🔐 로그인 시도:', {
            email: email,
            passwordLength: password.length,
            deviceInfo: this.getDeviceInfo(),
            firebaseReady: this.isFirebaseReady,
            timestamp: new Date().toISOString()
        });

        // 입력값 검증
        if (!email || !password) {
            console.warn('로그인 실패: 빈 입력값');
            alert('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        // 이메일 형식 검증
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            console.warn('로그인 실패: 잘못된 이메일 형식');
            alert('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        try {
            const success = await this.login(email, password);
            console.log('로그인 결과:', success ? '성공' : '실패');
        } catch (error) {
            console.error('로그인 처리 오류:', error);
            alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            localStorageAvailable: this.isLocalStorageAvailable(),
            screen: {
                width: screen.width,
                height: screen.height
            }
        };
    }

    isLocalStorageAvailable() {
        try {
            const test = 'localStorage-test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    async handleRegister(e) {
        const formInputs = e.target.querySelectorAll('input[type="text"]');
        const phoneInput = e.target.querySelector('input[type="tel"]').value;
        const termsCheckbox = document.getElementById('terms-checkbox');
        const privacyCheckbox = document.getElementById('privacy-checkbox');

        // 개인정보보호 동의 체크 검증
        if (!termsCheckbox.checked) {
            alert('이용약관 및 개인정보처리방침에 동의해주세요.');
            return;
        }

        if (!privacyCheckbox.checked) {
            alert('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }

        const userData = {
            name: formInputs[0].value,
            email: e.target.querySelector('input[type="email"]').value,
            password: e.target.querySelectorAll('input[type="password"]')[0].value,
            passwordConfirm: e.target.querySelectorAll('input[type="password"]')[1].value,
            phone: phoneInput,
            region: e.target.querySelector('select').value,  // 시도 필드 추가
            organization: formInputs[1].value  // 소속 필드
        };

        // 휴대폰 번호 형식 검증
        const phonePattern = /^010-\d{4}-\d{4}$/;
        if (!phonePattern.test(userData.phone)) {
            alert('형식에 맞지 않습니다. 다시 입력해주세요.\n올바른 형식: 010-0000-0000');
            return;
        }

        if (userData.password !== userData.passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        await this.register(userData);
    }

    async handlePasswordReset(e) {
        const email = e.target.querySelector('input[type="email"]').value.trim();

        if (!email) {
            alert('이메일을 입력해주세요.');
            return;
        }

        // 이메일 형식 검증
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        try {
            // Firebase Authentication 비밀번호 재설정
            if (this.isFirebaseReady && auth) {
                await auth.sendPasswordResetEmail(email);
                console.log('Firebase를 통한 비밀번호 재설정 이메일 전송 완료');
            } else {
                // 로컬 모드에서의 시뮬레이션
                console.log('로컬 모드: 비밀번호 재설정 이메일 전송 시뮬레이션');

                // 등록된 사용자인지 확인
                const userExists = this.users.some(user => user.email === email);
                if (!userExists) {
                    alert('등록되지 않은 이메일입니다.');
                    return;
                }
            }

            // 성공 UI 표시
            this.showPasswordResetSuccess();

        } catch (error) {
            console.error('비밀번호 재설정 오류:', error);

            if (error.code === 'auth/user-not-found') {
                alert('등록되지 않은 이메일입니다.');
            } else if (error.code === 'auth/invalid-email') {
                alert('올바르지 않은 이메일 형식입니다.');
            } else if (error.code === 'auth/too-many-requests') {
                alert('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                alert('비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        }
    }

    showPasswordResetSuccess() {
        // 폼 숨기고 성공 메시지 표시
        document.getElementById('password-reset-form').style.display = 'none';
        document.getElementById('reset-success').style.display = 'block';
    }

    handleContactForm(e) {
        alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
        e.target.reset();
    }

    getDefaultUsers() {
        return [
            {
                id: 1,
                name: "테스트 사용자",
                email: "test@example.com",
                password: "test123",
                phone: "010-1234-5678",
                registeredAt: new Date().toISOString()
            }
        ];
    }

    // Firebase 상태 확인 및 동기화
    async checkFirebaseStatus() {
        console.log('🔍 LMS Firebase 상태 확인 시작...');

        // firebaseService 준비 대기
        if (typeof firebaseService !== 'undefined') {
            try {
                const isReady = await firebaseService.waitForFirebase();
                this.isFirebaseReady = isReady;
                console.log(`🎯 LMS Firebase 상태 업데이트: ${this.isFirebaseReady ? 'Firebase 모드' : 'localStorage 모드'}`);

                // 상태 변경 시 알림
                if (this.isFirebaseReady) {
                    console.log('✅ Firebase 활성화 - 클라우드 동기화 사용');
                } else {
                    console.log('📱 localStorage 모드 - 로컬 저장소만 사용');
                }

                return this.isFirebaseReady;
            } catch (error) {
                console.error('Firebase 상태 확인 오류:', error);
                this.isFirebaseReady = false;
                return false;
            }
        } else {
            console.warn('⚠️ firebaseService가 로드되지 않음');
            this.isFirebaseReady = false;
            return false;
        }
    }

    // Firebase 상태를 수동으로 새로고침
    async refreshFirebaseStatus() {
        console.log('🔄 Firebase 상태 수동 새로고침...');
        const oldStatus = this.isFirebaseReady;
        const newStatus = await this.checkFirebaseStatus();

        if (oldStatus !== newStatus) {
            console.log(`🔄 Firebase 상태 변경: ${oldStatus ? 'Firebase' : 'localStorage'} → ${newStatus ? 'Firebase' : 'localStorage'}`);

            // 데이터 다시 로드
            await this.loadData();
            this.updateAuthUI();
        }

        return newStatus;
    }

    // Firebase 실시간 리스너 설정
    setupFirebaseListeners() {
        if (!this.isFirebaseReady || typeof db === 'undefined') {
            console.log('❌ Firebase 리스너 설정 불가 - Firebase 비활성화');
            return;
        }

        // 기존 리스너 정리
        this.cleanupListeners();

        console.log('🔔 Firebase 실시간 리스너 설정 중...');

        try {
            // 강좌 데이터 실시간 리스너
            const coursesUnsubscribe = db.collection('courses').onSnapshot((snapshot) => {
                console.log('🔄 강좌 데이터 실시간 업데이트 감지');

                const updatedCourses = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    firebaseId: doc.id
                }));

                // 데이터가 실제로 변경되었는지 확인
                if (JSON.stringify(this.courses) !== JSON.stringify(updatedCourses)) {
                    console.log('📚 강좌 데이터 변경됨 - UI 업데이트');
                    this.courses = updatedCourses;
                    this.renderCourses();

                    // 변경 알림 표시
                    this.showDataUpdateNotification('강좌 정보가 업데이트되었습니다.');
                }
            }, (error) => {
                console.error('강좌 실시간 리스너 오류:', error);
            });
            this.unsubscribers.push(coursesUnsubscribe);

            // 수강신청 데이터 실시간 리스너
            const enrollmentsUnsubscribe = db.collection('enrollments').onSnapshot((snapshot) => {
                console.log('🔄 수강신청 데이터 실시간 업데이트 감지');

                const updatedEnrollments = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    firebaseId: doc.id
                }));

                console.log('Firebase에서 받은 수강신청:', updatedEnrollments.length, '개');
                console.log('수강신청 상세:', updatedEnrollments.map(e => ({
                    id: e.id,
                    userId: e.userId,
                    courseId: e.courseId,
                    status: e.status
                })));

                if (JSON.stringify(this.enrollments) !== JSON.stringify(updatedEnrollments)) {
                    console.log('🎓 수강신청 데이터 변경됨 - 이전:', this.enrollments.length, '개 → 현재:', updatedEnrollments.length, '개');
                    this.enrollments = updatedEnrollments;

                    // 내 강좌 페이지가 활성화되어 있다면 새로고침
                    if (this.currentUser && document.getElementById('my-courses').style.display !== 'none') {
                        console.log('✅ 내 강좌 페이지 새로고침 중...');
                        this.loadMyCourses();
                    } else {
                        console.log('⏭️ 내 강좌 페이지 비활성 상태 - 새로고침 스킵');
                    }
                }
            }, (error) => {
                console.error('수강신청 실시간 리스너 오류:', error);
            });
            this.unsubscribers.push(enrollmentsUnsubscribe);

            // 설정 데이터 실시간 리스너
            const settingsUnsubscribe = db.collection('settings').doc('main').onSnapshot((doc) => {
                console.log('🔄 설정 데이터 실시간 업데이트 감지');

                if (doc.exists) {
                    const updatedSettings = doc.data();
                    console.log('⚙️ 설정 데이터 변경됨:', updatedSettings);

                    // 기본 설정과 병합
                    this.settings = { ...this.getDefaultSettings(), ...updatedSettings };

                    // UI에 새 설정 적용
                    this.applySettings();

                    // 변경 알림 표시
                    this.showDataUpdateNotification('페이지 설정이 업데이트되었습니다.');
                } else {
                    console.log('⚠️ 설정 문서가 존재하지 않음 - 기본 설정 사용');
                }
            }, (error) => {
                console.error('설정 실시간 리스너 오류:', error);
            });
            this.unsubscribers.push(settingsUnsubscribe);

            // 사용자 데이터 실시간 리스너
            const usersUnsubscribe = db.collection('users').onSnapshot((snapshot) => {
                console.log('🔄 사용자 데이터 실시간 업데이트 감지');

                const updatedUsers = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    firebaseId: doc.id
                }));

                if (JSON.stringify(this.users) !== JSON.stringify(updatedUsers)) {
                    console.log('👥 사용자 데이터 변경됨');
                    this.users = updatedUsers;
                    localStorage.setItem('lms_users', JSON.stringify(this.users));
                }
            }, (error) => {
                console.error('사용자 실시간 리스너 오류:', error);
            });
            this.unsubscribers.push(usersUnsubscribe);

            console.log('✅ Firebase 실시간 리스너 설정 완료 (총', this.unsubscribers.length, '개)');

        } catch (error) {
            console.error('Firebase 리스너 설정 오류:', error);
        }
    }

    // Firebase 리스너 정리
    cleanupListeners() {
        if (this.unsubscribers.length > 0) {
            console.log('🧹 Firebase 리스너 정리 중...', this.unsubscribers.length, '개');
            this.unsubscribers.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('리스너 정리 오류:', error);
                }
            });
            this.unsubscribers = [];
            console.log('✅ Firebase 리스너 정리 완료');
        }
    }

    // 페이지 언로드 시 리스너 정리
    destroy() {
        console.log('🔻 LMS 시스템 종료 중...');
        this.cleanupListeners();
    }

    // 데이터 업데이트 알림 표시
    showDataUpdateNotification(message) {
        // 기존 알림이 있다면 제거
        const existingNotification = document.querySelector('.data-update-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = 'data-update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        // CSS 애니메이션 추가
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 3초 후 자동 제거
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 기본 설정값 반환
    getDefaultSettings() {
        return {
            siteTitle: '장삼넷 학습관리시스템',
            siteDescription: '전문적인 온라인 학습 경험을 제공합니다',
            contactEmail: 'info@jjangsamnet.com',
            contactPhone: '02-1234-5678',
            heroTitle: '미래를 위한 학습, 지금 시작하세요',
            heroSubtitle: '전문 강사진과 함께하는 체계적인 온라인 교육',
            heroButton: '강좌 둘러보기',
            facebookUrl: '',
            instagramUrl: '',
            youtubeUrl: '',
            smtpServer: '',
            smtpPort: '',
            senderEmail: ''
        };
    }

    // 수강증 발급
    generateCertificate(courseId) {
        console.log('📜 수강증 발급 시작, courseId:', courseId);

        // 강좌 정보 찾기
        const course = this.courses.find(c => c.id == courseId);
        if (!course) {
            alert('강좌 정보를 찾을 수 없습니다.');
            return;
        }

        // 수강신청 정보 찾기 (중복 가능하므로 최대 진도율 사용)
        const userEnrollments = this.enrollments.filter(e =>
            e.userId === this.currentUser.id && e.courseId == courseId
        );

        if (userEnrollments.length === 0) {
            alert('수강신청 정보를 찾을 수 없습니다.');
            return;
        }

        const maxProgress = Math.max(...userEnrollments.map(e => e.progress || 0));

        if (maxProgress < 90) {
            alert(`수강 완료율이 90% 미만입니다. (현재: ${maxProgress}%)`);
            return;
        }

        // 소속 정보 확인 및 입력
        let affiliation = this.currentUser.affiliation || '';
        if (!affiliation) {
            affiliation = prompt('소속을 입력해주세요 (예: 대화초등학교):', '');
            if (!affiliation) {
                alert('소속 정보가 필요합니다.');
                return;
            }
            // 소속 정보 저장
            this.currentUser.affiliation = affiliation;
            if (this.isFirebaseReady && typeof firebaseService !== 'undefined') {
                firebaseService.updateUser(this.currentUser.id, { affiliation: affiliation });
            } else {
                localStorage.setItem('lms_current_user', JSON.stringify(this.currentUser));
            }
        }

        // 수강증 HTML 생성
        const certificateHTML = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>수강증 - ${course.title}</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                <style>
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                    body {
                        font-family: 'Nanum Myeongjo', serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: #f0f0f0;
                        padding: 20px;
                    }
                    .certificate {
                        width: 800px;
                        padding: 60px;
                        background: white;
                        border: 15px solid #2c5aa0;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        position: relative;
                    }
                    .certificate::before {
                        content: '';
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        right: 20px;
                        bottom: 20px;
                        border: 2px solid #d4af37;
                    }
                    .cert-content {
                        position: relative;
                        text-align: center;
                    }
                    .cert-title {
                        font-size: 36px;
                        font-weight: bold;
                        color: #2c5aa0;
                        margin-bottom: 40px;
                        letter-spacing: 8px;
                    }
                    .cert-info {
                        text-align: right;
                        margin: 30px 0;
                        font-size: 20px;
                        line-height: 1.8;
                    }
                    .cert-info-row {
                        margin: 10px 0;
                    }
                    .cert-info-label {
                        font-weight: normal;
                        display: inline-block;
                        width: 80px;
                    }
                    .cert-info-value {
                        font-weight: bold;
                    }
                    .cert-course {
                        font-size: 16px;
                        margin: 30px 0;
                        line-height: 1.4;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .cert-text {
                        font-size: 20px;
                        line-height: 1.8;
                        margin: 20px 0;
                        color: #333;
                    }
                    .cert-date {
                        font-size: 18px;
                        margin-top: 40px;
                    }
                    .cert-org {
                        font-size: 24px;
                        font-weight: bold;
                        margin-top: 50px;
                        color: #2c5aa0;
                    }
                    .btn-container {
                        text-align: center;
                        margin-top: 30px;
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        flex-wrap: wrap;
                    }
                    .btn {
                        padding: 12px 30px;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .btn-print {
                        background: #2c5aa0;
                        color: white;
                    }
                    .btn-print:hover {
                        background: #1e3a6e;
                    }
                    .btn-close {
                        background: #666;
                        color: white;
                    }
                    .btn-close:hover {
                        background: #444;
                    }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="cert-content">
                        <div class="cert-title">수 강 증</div>

                        <div class="cert-info">
                            <div class="cert-info-row">
                                <span class="cert-info-label">소속:</span>
                                <span class="cert-info-value">${affiliation}</span>
                            </div>
                            <div class="cert-info-row">
                                <span class="cert-info-label">이름:</span>
                                <span class="cert-info-value">${this.currentUser.name}</span>
                            </div>
                        </div>

                        <div class="cert-course">
                            <strong>과정명:</strong> ${course.title}
                        </div>

                        <div class="cert-text">
                            위 사람은 본 학회가 주관하는<br>
                            위의 교육과정을 성실히 수강하였으므로<br>
                            이 증서를 수여합니다.
                        </div>

                        <div class="cert-date">
                            ${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 ${new Date().getDate()}일
                        </div>

                        <div class="cert-org">
                            (사)한국창의정보문화학회
                        </div>
                    </div>
                </div>

                <div class="btn-container no-print">
                    <button class="btn btn-print" onclick="downloadPDF()">PDF 다운로드</button>
                    <button class="btn btn-print" onclick="window.print()">인쇄하기</button>
                    <button class="btn btn-close" onclick="window.close()">닫기</button>
                </div>

                <script>
                    function downloadPDF() {
                        const element = document.querySelector('.certificate');
                        const opt = {
                            margin: 10,
                            filename: '수강증_${this.currentUser.name}_${course.title}.pdf',
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };
                        html2pdf().set(opt).from(element).save();
                    }
                </script>
            </body>
            </html>
        `;

        // 새 창에서 수강증 열기
        const certificateWindow = window.open('', '_blank', 'width=900,height=800');
        certificateWindow.document.write(certificateHTML);
        certificateWindow.document.close();
    }

    // 회원정보 모달 표시
    showUserProfileModal() {
        if (!this.currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        // 현재 사용자 정보로 폼 채우기
        document.getElementById('profile-name').value = this.currentUser.name || '';
        document.getElementById('profile-email').value = this.currentUser.email || '';
        document.getElementById('profile-phone').value = this.currentUser.phone || '';
        document.getElementById('profile-affiliation').value = this.currentUser.affiliation || '';
        document.getElementById('profile-region').value = this.currentUser.region || '';

        // 모달 표시
        document.getElementById('user-profile-modal').style.display = 'block';

        // 폼 제출 이벤트 리스너
        const form = document.getElementById('user-profile-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.updateUserProfile();
        };
    }

    // 회원정보 업데이트
    async updateUserProfile() {
        const name = document.getElementById('profile-name').value;
        const phone = document.getElementById('profile-phone').value;
        const affiliation = document.getElementById('profile-affiliation').value;
        const region = document.getElementById('profile-region').value;

        try {
            // 사용자 정보 업데이트
            this.currentUser.name = name;
            this.currentUser.phone = phone;
            this.currentUser.affiliation = affiliation;
            this.currentUser.region = region;

            // Firebase 또는 localStorage에 저장
            if (this.isFirebaseReady && typeof firebaseService !== 'undefined') {
                await firebaseService.updateUser(this.currentUser.id, {
                    name: name,
                    phone: phone,
                    affiliation: affiliation,
                    region: region
                });
                console.log('✅ Firebase에 회원정보 업데이트 완료');
            } else {
                localStorage.setItem('lms_current_user', JSON.stringify(this.currentUser));
                console.log('✅ localStorage에 회원정보 업데이트 완료');
            }

            // UI 업데이트
            document.getElementById('user-name-display').textContent = name;

            // 모달 닫기
            this.closeModal('user-profile-modal');

            alert('회원정보가 성공적으로 수정되었습니다.');
        } catch (error) {
            console.error('회원정보 업데이트 오류:', error);
            alert('회원정보 수정 중 오류가 발생했습니다.');
        }
    }

    // 설정을 UI에 적용
    applySettings() {
        console.log('🎨 설정을 UI에 적용 중...', this.settings);

        // 페이지 제목 적용
        if (this.settings.siteTitle) {
            document.title = this.settings.siteTitle;

            // 헤더의 사이트 제목 변경
            const siteTitleElements = document.querySelectorAll('.site-title, .logo-text, h1.title');
            siteTitleElements.forEach(el => {
                el.textContent = this.settings.siteTitle;
            });
        }

        // 히어로 섹션 적용
        if (this.settings.heroTitle) {
            const heroTitleEl = document.querySelector('.hero h1, .hero-title');
            if (heroTitleEl) heroTitleEl.textContent = this.settings.heroTitle;
        }

        if (this.settings.heroSubtitle) {
            const heroSubtitleEl = document.querySelector('.hero p, .hero-subtitle');
            if (heroSubtitleEl) heroSubtitleEl.textContent = this.settings.heroSubtitle;
        }

        if (this.settings.heroButton) {
            const heroButtonEl = document.querySelector('.hero .btn, .hero-button');
            if (heroButtonEl) heroButtonEl.textContent = this.settings.heroButton;
        }

        // 연락처 정보 적용
        if (this.settings.contactEmail) {
            const emailElements = document.querySelectorAll('.contact-email, [data-email]');
            emailElements.forEach(el => {
                el.textContent = this.settings.contactEmail;
                if (el.href) el.href = `mailto:${this.settings.contactEmail}`;
            });
        }

        if (this.settings.contactPhone) {
            const phoneElements = document.querySelectorAll('.contact-phone, [data-phone]');
            phoneElements.forEach(el => {
                el.textContent = this.settings.contactPhone;
                if (el.href) el.href = `tel:${this.settings.contactPhone}`;
            });
        }

        // 소셜 미디어 링크 적용
        const socialLinks = {
            facebook: this.settings.facebookUrl,
            instagram: this.settings.instagramUrl,
            youtube: this.settings.youtubeUrl
        };

        Object.entries(socialLinks).forEach(([platform, url]) => {
            if (url) {
                const linkEl = document.querySelector(`.social-${platform}, [data-social="${platform}"]`);
                if (linkEl) {
                    linkEl.href = url;
                    linkEl.style.display = 'inline-block';
                }
            }
        });

        console.log('✅ 설정 UI 적용 완료');
    }
}

// 전역 함수들
function showLogin() {
    lms.showLogin();
}

function showRegister() {
    lms.showRegister();
}

function showPasswordReset() {
    lms.showPasswordReset();
}

function closeModal(modalId) {
    lms.closeModal(modalId);
}

function showUserProfileModal() {
    lms.showUserProfileModal();
}

function showSection(sectionId) {
    lms.showSection(sectionId);
}

function enrollCourse() {
    lms.enrollCourse();
}

function addToWishlist() {
    lms.addToWishlist();
}

function logout() {
    lms.logout();
}

function showTermsModal(event) {
    if (event) event.preventDefault();
    document.getElementById('terms-modal').style.display = 'block';
}

function showPrivacyPolicyModal(event) {
    if (event) event.preventDefault();
    document.getElementById('privacy-policy-modal').style.display = 'block';
}

function showPrivacyConsentModal(event) {
    if (event) event.preventDefault();
    document.getElementById('privacy-consent-modal').style.display = 'block';
}

function continueLearning(courseId) {
    console.log('continueLearning 함수 호출됨, courseId:', courseId);

    // 학습 페이지로 이동 (courseId를 URL 파라미터로 전달)
    const url = `course-learning.html?courseId=${courseId}`;
    console.log('이동할 URL:', url);

    window.location.href = url;
}

function viewCourseDetail(courseId) {
    lms.showCourseDetail(courseId);
}

// LMS 시스템 초기화
const lms = new LMSSystem();

// 페이지 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 LMS 페이지 로드 완료');

    // Firebase 서비스 준비 이벤트 리스너
    document.addEventListener('firebaseServiceReady', async (e) => {
        console.log('🔥 Firebase 서비스 준비 이벤트 수신:', e.detail);
        await lms.refreshFirebaseStatus();
    });

    // 3초 후에도 Firebase 상태가 업데이트되지 않았다면 수동으로 확인
    setTimeout(async () => {
        if (!lms.isFirebaseReady) {
            console.log('⏰ 3초 후 Firebase 상태 재확인...');
            await lms.refreshFirebaseStatus();
        }
    }, 3000);

    console.log('LMS 시스템이 초기화되었습니다.');
});

// 페이지 언로드 시 리스너 정리
window.addEventListener('beforeunload', () => {
    console.log('📴 페이지 종료 - 리소스 정리 중...');
    lms.destroy();
});

// 페이지 숨김 시에도 정리 (모바일 대응)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('👻 페이지 숨김 - 리소스 일시 정리');
        // 필요시 리스너 일시 정지 로직 추가 가능
    }
});

// 개발자 도구용 전역 디버그 함수들
window.lmsDebug = {
    checkFirebaseStatus: () => lms.checkFirebaseStatus(),
    refreshFirebaseStatus: () => lms.refreshFirebaseStatus(),
    getFirebaseReady: () => lms.isFirebaseReady,
    refreshData: async () => {
        console.log('🔄 데이터 수동 새로고침...');
        await lms.loadData();
        console.log('✅ 데이터 새로고침 완료');
    },
    getCourses: () => {
        console.log('현재 강좌 데이터:', lms.courses);
        return lms.courses;
    },
    setupListeners: () => {
        console.log('🔔 실시간 리스너 수동 설정...');
        lms.setupFirebaseListeners();
    },
    testNotification: (message = '테스트 알림입니다.') => {
        lms.showDataUpdateNotification(message);
    },
    getSettings: () => {
        console.log('현재 설정 데이터:', lms.settings);
        return lms.settings;
    },
    applySettings: () => {
        console.log('🎨 설정 수동 적용...');
        lms.applySettings();
    },
    testSettings: async () => {
        console.log('🧪 설정 테스트 시작...');
        if (lms.isFirebaseReady) {
            const settings = await firebaseService.getSettings();
            console.log('Firebase 설정:', settings);
            return settings;
        } else {
            const settings = JSON.parse(localStorage.getItem('lms_settings') || '{}');
            console.log('로컬 설정:', settings);
            return settings;
        }
    },
    testRegistration: async (email = `test-${Date.now()}@example.com`, password = 'test123') => {
        console.log('🧪 테스트 회원가입 시작:', { email, password });
        const result = await lms.register({
            name: '테스트 사용자',
            email: email,
            password: password,
            phone: '010-1234-5678'
        });
        console.log('회원가입 결과:', result);
        return result;
    }
};

console.log('🛠️ 디버그 도구 사용법:');
console.log('- lmsDebug.checkFirebaseStatus() : Firebase 상태 확인');
console.log('- lmsDebug.refreshFirebaseStatus() : Firebase 상태 새로고침');
console.log('- lmsDebug.getFirebaseReady() : 현재 Firebase 상태');
console.log('- lmsDebug.refreshData() : 강좌 데이터 수동 새로고침');
console.log('- lmsDebug.getCourses() : 현재 강좌 데이터 확인');
console.log('- lmsDebug.setupListeners() : 실시간 리스너 수동 설정');
console.log('- lmsDebug.testNotification() : 알림 테스트');
console.log('- lmsDebug.testRegistration() : 테스트 회원가입 실행');