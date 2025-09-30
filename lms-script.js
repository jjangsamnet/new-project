// LMS 시스템 JavaScript

class LMSSystem {
    constructor() {
        this.isFirebaseReady = false;
        this.courses = [
            {
                id: 1,
                title: "JavaScript 완전정복",
                instructor: "김개발",
                category: "programming",
                price: "₩150,000",
                duration: "8주",
                level: "초급",
                rating: 4.8,
                students: 1205,
                description: "JavaScript의 기본부터 고급 개념까지 체계적으로 학습할 수 있는 강좌입니다. 실무에서 바로 활용할 수 있는 프로젝트들을 통해 실력을 향상시켜보세요.",
                curriculum: [
                    "JavaScript 기본 문법",
                    "DOM 조작 및 이벤트 처리",
                    "비동기 프로그래밍",
                    "ES6+ 최신 문법",
                    "실전 프로젝트"
                ]
            },
            {
                id: 2,
                title: "React 마스터클래스",
                instructor: "이프론트",
                category: "programming",
                price: "₩200,000",
                duration: "10주",
                level: "중급",
                rating: 4.9,
                students: 856,
                description: "React를 이용한 현대적인 웹 애플리케이션 개발을 배우는 강좌입니다. 컴포넌트 기반 개발부터 상태 관리까지 완벽하게 마스터하세요.",
                curriculum: [
                    "React 기본 개념",
                    "컴포넌트와 Props",
                    "State와 생명주기",
                    "Hooks 활용",
                    "Redux를 이용한 상태 관리"
                ]
            },
            {
                id: 3,
                title: "UI/UX 디자인 기초",
                instructor: "박디자인",
                category: "design",
                price: "₩120,000",
                duration: "6주",
                level: "초급",
                rating: 4.7,
                students: 634,
                description: "사용자 중심의 디자인 사고와 실무에서 바로 활용할 수 있는 UI/UX 디자인 스킬을 배우는 강좌입니다.",
                curriculum: [
                    "디자인 씽킹",
                    "사용자 리서치",
                    "와이어프레임 제작",
                    "프로토타이핑",
                    "사용성 테스트"
                ]
            },
            {
                id: 4,
                title: "비즈니스 전략 기획",
                instructor: "최전략",
                category: "business",
                price: "₩180,000",
                duration: "8주",
                level: "중급",
                rating: 4.6,
                students: 423,
                description: "성공적인 비즈니스 전략을 수립하고 실행하는 방법을 배우는 강좌입니다. 실제 사례 분석을 통해 실무 역량을 키워보세요.",
                curriculum: [
                    "시장 분석 방법론",
                    "경쟁사 분석",
                    "SWOT 분석",
                    "전략 수립 프로세스",
                    "실행 계획 수립"
                ]
            },
            {
                id: 5,
                title: "영어 회화 완성",
                instructor: "존 스미스",
                category: "language",
                price: "₩100,000",
                duration: "12주",
                level: "초급",
                rating: 4.8,
                students: 892,
                description: "일상 회화부터 비즈니스 영어까지, 실생활에서 바로 활용할 수 있는 영어 회화 능력을 기르는 강좌입니다.",
                curriculum: [
                    "기본 회화 표현",
                    "일상 생활 영어",
                    "비즈니스 영어",
                    "프레젠테이션 영어",
                    "면접 영어"
                ]
            },
            {
                id: 6,
                title: "Figma 마스터",
                instructor: "김피그마",
                category: "design",
                price: "₩90,000",
                duration: "4주",
                level: "초급",
                rating: 4.9,
                students: 567,
                description: "Figma를 활용한 UI 디자인과 프로토타이핑을 완전히 마스터하는 강좌입니다. 협업 기능까지 모두 다룹니다.",
                curriculum: [
                    "Figma 기본 인터페이스",
                    "컴포넌트 시스템",
                    "프로토타이핑",
                    "협업 기능",
                    "디자인 시스템 구축"
                ]
            }
        ];

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
                const [courses, enrollments] = await Promise.all([
                    firebaseService.getCourses(),
                    firebaseService.getEnrollments()
                ]);

                // Firebase에서 강좌 데이터가 없으면 기본 데이터 사용
                if (courses.length === 0) {
                    await this.initializeDefaultCourses();
                } else {
                    this.courses = courses;
                }

                this.enrollments = enrollments;
                this.currentUser = await firebaseService.getCurrentUser();
            } else {
                // 로컬 스토리지 폴백
                this.users = JSON.parse(localStorage.getItem('lms_users')) || this.getDefaultUsers();
                this.currentUser = JSON.parse(localStorage.getItem('lms_current_user')) || null;
                this.enrollments = JSON.parse(localStorage.getItem('lms_enrollments')) || [];
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            // 오류 시 로컬 스토리지 사용
            this.users = JSON.parse(localStorage.getItem('lms_users')) || this.getDefaultUsers();
            this.currentUser = JSON.parse(localStorage.getItem('lms_current_user')) || null;
            this.enrollments = JSON.parse(localStorage.getItem('lms_enrollments')) || [];
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

        // 필터 버튼 이벤트
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                this.filterCourses(category);

                // 활성 버튼 변경
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

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
                    <span class="course-category">${this.getCategoryName(course.category)}</span>
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-instructor">강사: ${course.instructor}</p>
                    <div class="course-footer">
                        <span class="course-price">${course.price}</span>
                        <div class="course-rating">
                            <span>⭐ ${course.rating}</span>
                            <span>(${course.students})</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterCourses(category) {
        if (category === 'all') {
            this.renderCourses();
        } else {
            const filteredCourses = this.courses.filter(course => course.category === category);
            this.renderCourses(filteredCourses);
        }
    }

    getCategoryName(category) {
        const categoryNames = {
            'programming': '프로그래밍',
            'design': '디자인',
            'business': '비즈니스',
            'language': '언어'
        };
        return categoryNames[category] || category;
    }

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
        document.getElementById('course-price').textContent = course.price;
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
        const isEnrolled = this.enrollments.find(e => e.userId === this.currentUser.id && e.courseId === courseId);

        if (isEnrolled) {
            alert('이미 수강중인 강좌입니다.');
            return;
        }

        // 수강신청 모달에 정보 설정
        document.getElementById('enrollment-course-title').textContent = course.title;
        document.getElementById('enrollment-instructor').textContent = course.instructor;
        document.getElementById('enrollment-price').textContent = course.price;

        // 수강신청 모달 표시
        this.closeModal('course-detail-modal');
        document.getElementById('enrollment-modal').style.display = 'block';
    }

    async handleEnrollment(e) {
        const courseId = parseInt(document.querySelector('#course-detail-modal .btn-primary').getAttribute('data-course-id'));
        const paymentMethod = e.target.querySelector('select').value;
        const agreeTerms = e.target.querySelector('input[type="checkbox"]').checked;

        if (!paymentMethod) {
            alert('결제 방법을 선택해주세요.');
            return;
        }

        if (!agreeTerms) {
            alert('수강 약관에 동의해주세요.');
            return;
        }

        // 수강신청 정보 저장
        const enrollment = {
            id: Date.now(),
            userId: this.currentUser.id,
            courseId: courseId,
            paymentMethod: paymentMethod,
            enrolledAt: new Date().toISOString(),
            status: 'enrolled'
        };

        try {
            // Firebase에 수강신청 저장
            const result = await firebaseService.saveEnrollment(enrollment);

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

        // 현재 사용자의 수강신청 목록 가져오기
        const userEnrollments = this.enrollments.filter(e => e.userId === this.currentUser.id && e.status === 'enrolled');

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
                            <span class="course-category">${this.getCategoryName(course.category)}</span>
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
        const userData = {
            name: e.target.querySelector('input[type="text"]').value,
            email: e.target.querySelector('input[type="email"]').value,
            password: e.target.querySelectorAll('input[type="password"]')[0].value,
            passwordConfirm: e.target.querySelectorAll('input[type="password"]')[1].value,
            phone: e.target.querySelector('input[type="tel"]').value
        };

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
    // 추가 초기화 작업이 필요한 경우 여기에 작성
    console.log('LMS 시스템이 초기화되었습니다.');
});