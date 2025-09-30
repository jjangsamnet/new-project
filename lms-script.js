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

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email') || e.target.querySelector('input[type="email"]').value;
        const password = formData.get('password') || e.target.querySelector('input[type="password"]').value;

        // 사용자 검증
        const user = this.users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('lms_current_user', JSON.stringify(user));
            this.updateAuthUI();
            this.closeModal('login-modal');
            alert('로그인되었습니다!');
        } else {
            alert('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
    }

    handleRegister(e) {
        const inputs = e.target.querySelectorAll('input');
        const name = inputs[0].value;
        const email = inputs[1].value;
        const password = inputs[2].value;
        const confirmPassword = inputs[3].value;
        const phone = inputs[4].value;
        const agreeTerms = inputs[5].checked;

        // 유효성 검사
        if (!agreeTerms) {
            alert('이용약관에 동의해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (this.users.find(u => u.email === email)) {
            alert('이미 등록된 이메일입니다.');
            return;
        }

        // 새 사용자 생성
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            phone,
            registeredAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('lms_users', JSON.stringify(this.users));

        alert('회원가입이 완료되었습니다!');
        this.closeModal('register-modal');
        e.target.reset();
    }

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
        try {
            const result = await firebaseService.signIn(email, password);

            if (result.success) {
                this.currentUser = result.user;
                this.updateAuthUI();
                await this.loadMyCourses();
                this.closeAllModals();
                alert('로그인되었습니다!');
                return true;
            } else {
                alert(result.error || '로그인에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            alert('로그인 중 오류가 발생했습니다.');
            return false;
        }
    }

    async register(userData) {
        try {
            const result = await firebaseService.signUp(userData.email, userData.password, userData);

            if (result.success) {
                alert('회원가입이 완료되었습니다!');
                this.closeAllModals();
                return true;
            } else {
                alert(result.error || '회원가입에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
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
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        await this.login(email, password);
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
    alert('학습 페이지로 이동합니다. (구현 예정)');
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