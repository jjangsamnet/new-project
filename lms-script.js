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

        this.initializeWithFirebase();
    }

    async initializeWithFirebase() {
        // Firebase 서비스 준비 대기
        await firebaseService.waitForFirebase();
        this.isFirebaseReady = firebaseService.isFirebaseReady;

        // 데이터 로드
        await this.loadData();

        // 일반 초기화
        this.init();
    }

    async loadData() {
        try {
            // Firebase에서 데이터 로드
            if (this.isFirebaseReady) {
                console.log('🔥 Firebase에서 데이터 로드 시작...');

                const [courses, enrollments, settings] = await Promise.all([
                    firebaseService.getCourses(),
                    firebaseService.getEnrollments(),
                    firebaseService.getSettings()
                ]);

                console.log(`📚 로드된 강좌 수: ${courses.length}`);
                console.log(`🎓 로드된 수강신청 수: ${enrollments.length}`);
                console.log(`⚙️ 로드된 설정:`, settings);

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
                // 로컬 스토리지 폴백
                this.users = JSON.parse(localStorage.getItem('lms_users')) || this.getDefaultUsers();
                this.currentUser = JSON.parse(localStorage.getItem('lms_current_user')) || null;
                this.enrollments = JSON.parse(localStorage.getItem('lms_enrollments')) || [];

                // 설정 로드 및 적용
                const localSettings = JSON.parse(localStorage.getItem('lms_settings')) || {};
                this.settings = { ...this.getDefaultSettings(), ...localSettings };
                console.log('💾 로컬 설정 로드 완료:', this.settings);
                this.applySettings();
            }

            // 강좌 렌더링
            this.renderCourses();

        } catch (error) {
            console.error('데이터 로드 오류:', error);
            // 오류 시 로컬 스토리지 사용
            this.users = JSON.parse(localStorage.getItem('lms_users')) || this.getDefaultUsers();
            this.currentUser = JSON.parse(localStorage.getItem('lms_current_user')) || null;
            this.enrollments = JSON.parse(localStorage.getItem('lms_enrollments')) || [];

            // 설정도 로컬에서 로드
            const localSettings = JSON.parse(localStorage.getItem('lms_settings')) || {};
            this.settings = { ...this.getDefaultSettings(), ...localSettings };
            console.log('❌ 오류 시 로컬 설정 로드:', this.settings);
            this.applySettings();

            this.renderCourses();
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

    renderCourses(coursesToRender = this.courses) {
        const coursesGrid = document.getElementById('courses-grid');

        if (coursesToRender.length === 0) {
            coursesGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #6c757d;">해당하는 강좌가 없습니다.</p>';
            return;
        }

        coursesGrid.innerHTML = coursesToRender.map(course => `
            <div class="course-card" onclick="lms.showCourseDetail(${course.id})">
                <div class="course-image">
                    <div class="placeholder-image">강좌 썸네일</div>
                </div>
                <div class="course-content">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-instructor">강사: ${course.instructor}</p>
                    <div class="course-footer">
                        <span class="course-badge" style="background: #28a745; color: white; padding: 5px 12px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">무료</span>
                        <div class="course-rating">
                            <span>⭐ ${course.rating}</span>
                            <span>(${course.students})</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
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

        // 수강신청 정보 저장
        const enrollment = {
            id: Date.now(),
            userId: this.currentUser.id,
            courseId: courseId,
            paymentMethod: 'free',  // 무료 강좌
            enrolledAt: new Date().toISOString(),
            status: 'enrolled'
        };

        console.log('💾 수강신청 생성 중...');
        console.log('수강신청 정보:', enrollment);
        console.log('현재 사용자 ID:', this.currentUser.id);
        console.log('현재 사용자 authMethod:', this.currentUser.authMethod);

        try {
            // Firebase에 수강신청 저장
            const result = await firebaseService.saveEnrollment(enrollment);
            console.log('Firebase 저장 결과:', result);

            if (result.success || !this.isFirebaseReady) {
                this.enrollments.push(enrollment);

                // 로컬 스토리지에도 백업 저장 (Firebase 실패 시 대비)
                if (!this.isFirebaseReady) {
                    localStorage.setItem('lms_enrollments', JSON.stringify(this.enrollments));
                }

                // 내 강좌 목록 새로고침
                await this.loadMyCourses();

                alert('수강신청이 완료되었습니다!');
                this.closeModal('enrollment-modal');
            } else {
                alert('수강신청 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('수강신청 오류:', error);
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
        console.log('현재 사용자 ID:', this.currentUser.id);
        console.log('현재 사용자 정보:', this.currentUser);
        console.log('전체 수강신청 수:', this.enrollments.length);
        console.log('전체 수강신청 목록:', this.enrollments.map(e => ({
            enrollmentId: e.id,
            userId: e.userId,
            courseId: e.courseId,
            status: e.status
        })));

        // 현재 사용자의 수강신청 목록 가져오기
        const userEnrollments = this.enrollments.filter(e => e.userId === this.currentUser.id && e.status === 'enrolled');

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

        // 수강중인 강좌들 렌더링
        const enrolledCourses = userEnrollments.map(enrollment => {
            return this.courses.find(course => course.id === enrollment.courseId);
        }).filter(course => course); // null 값 제거

        enrolledCoursesContainer.innerHTML = this.renderMyCoursesGrid(enrolledCourses);
    }

    renderMyCoursesGrid(courses) {
        return `
            <div class="my-courses-grid">
                ${courses.map(course => `
                    <div class="my-course-card">
                        <div class="course-thumbnail">
                            <div class="placeholder-image">
                                <span>강좌 썸네일</span>
                            </div>
                            <div class="course-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 25%"></div>
                                </div>
                                <span class="progress-text">25% 완료</span>
                            </div>
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${course.title}</h3>
                            <p class="course-instructor">강사: ${course.instructor}</p>
                            <div class="course-actions">
                                <button class="btn btn-primary" onclick="continueLearning(${course.id})">학습 계속하기</button>
                                <button class="btn btn-outline" onclick="viewCourseDetail(${course.id})">강좌 정보</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async login(email, password) {
        console.log('📧 로그인 함수 시작:', { email, firebaseReady: this.isFirebaseReady });

        try {
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

                this.updateAuthUI();
                await this.loadMyCourses();
                this.closeAllModals();

                alert(`로그인되었습니다! (${loginResult.method})`);
                return true;

            } else {
                console.log('❌ 모든 로그인 방법 실패');

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
            alert('로그인 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
            return false;
        }
    }

    async register(userData) {
        console.log('📝 회원가입 시작:', { email: userData.email, firebaseReady: this.isFirebaseReady });

        try {
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

                alert(`회원가입이 완료되었습니다! (${registrationResult.method})`);
                this.closeAllModals();
                return true;

            } else {
                console.log('❌ 모든 회원가입 방법 실패');
                alert('회원가입에 실패했습니다. 다시 시도해주세요.');
                return false;
            }

        } catch (error) {
            console.error('회원가입 전체 오류:', error);
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

        console.log('🔔 Firebase 실시간 리스너 설정 중...');

        try {
            // 강좌 데이터 실시간 리스너
            db.collection('courses').onSnapshot((snapshot) => {
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

            // 수강신청 데이터 실시간 리스너
            db.collection('enrollments').onSnapshot((snapshot) => {
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

            // 설정 데이터 실시간 리스너
            db.collection('settings').doc('main').onSnapshot((doc) => {
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

            // 사용자 데이터 실시간 리스너
            db.collection('users').onSnapshot((snapshot) => {
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

            console.log('✅ Firebase 실시간 리스너 설정 완료');

        } catch (error) {
            console.error('Firebase 리스너 설정 오류:', error);
        }
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