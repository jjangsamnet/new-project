// 관리자 시스템 JavaScript

class AdminSystem {
    constructor() {
        this.isFirebaseReady = false;
        this.courses = [];
        this.users = [];
        this.enrollments = [];
        this.settings = {};
        this.currentEditingCourse = null;
        this.currentEditingLesson = null;
        this.isAuthenticated = false;
        this.listenersSetup = false; // 리스너 중복 설정 방지

        // 관리자 계정 정보
        this.adminCredentials = {
            username: 'jjangsam',
            password: '16181618wkd'
        };

        this.initializeWithFirebase();
    }

    async initializeWithFirebase() {
        // Firebase 서비스 준비 대기
        await firebaseService.waitForFirebase();
        this.isFirebaseReady = firebaseService.isFirebaseReady;

        console.log('🔥 AdminSystem Firebase 초기화 완료:', this.isFirebaseReady);

        // 실시간 리스너 설정
        if (this.isFirebaseReady) {
            this.setupRealtimeListeners();
        }

        // 일반 초기화
        this.init();

        // Firebase 상태가 나중에 변경될 수 있으므로 주기적으로 확인
        setInterval(() => {
            if (this.isFirebaseReady !== firebaseService.isFirebaseReady) {
                console.log('🔄 Firebase 상태 변경 감지:', firebaseService.isFirebaseReady);
                this.isFirebaseReady = firebaseService.isFirebaseReady;

                // Firebase가 준비되면 실시간 리스너 설정
                if (this.isFirebaseReady) {
                    this.setupRealtimeListeners();
                }
            }
        }, 1000);
    }

    init() {
        // 로그인 상태 확인
        this.checkAuthStatus();

        if (this.isAuthenticated) {
            this.showAdminDashboard();
        } else {
            this.showLoginForm();
        }
    }

    async loadData() {
        try {
            if (this.isFirebaseReady) {
                const [courses, users, enrollments, settings] = await Promise.all([
                    firebaseService.getCourses(),
                    firebaseService.getUsers(),
                    firebaseService.getEnrollments(),
                    firebaseService.getSettings()
                ]);

                this.courses = courses.length > 0 ? courses : this.getDefaultCourses();
                this.users = users || [];
                this.enrollments = enrollments;
                this.settings = settings || this.getDefaultSettings();

                // 초기 데이터가 없으면 기본값 저장
                if (courses.length === 0) {
                    for (const course of this.getDefaultCourses()) {
                        await firebaseService.saveCourse(course);
                    }
                }
                if (!settings) {
                    await firebaseService.saveSettings(this.getDefaultSettings());
                }
            } else {
                // 로컬 스토리지 폴백
                this.courses = JSON.parse(localStorage.getItem('lms_courses')) || this.getDefaultCourses();
                this.users = JSON.parse(localStorage.getItem('lms_users')) || [];
                this.enrollments = JSON.parse(localStorage.getItem('lms_enrollments')) || [];
                this.settings = JSON.parse(localStorage.getItem('lms_settings')) || this.getDefaultSettings();
            }
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            // 오류 시 로컬 스토리지 사용
            this.courses = JSON.parse(localStorage.getItem('lms_courses')) || this.getDefaultCourses();
            this.users = JSON.parse(localStorage.getItem('lms_users')) || [];
            this.enrollments = JSON.parse(localStorage.getItem('lms_enrollments')) || [];
            this.settings = JSON.parse(localStorage.getItem('lms_settings')) || this.getDefaultSettings();
        }
    }

    checkAuthStatus() {
        // 세션에서 로그인 상태 확인
        const authStatus = sessionStorage.getItem('admin_authenticated');
        this.isAuthenticated = authStatus === 'true';
    }

    showLoginForm() {
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
        this.bindLoginEvents();
    }

    async showAdminDashboard() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        this.bindDashboardEvents();

        // 데이터 로드
        await this.loadData();

        // UI 업데이트
        this.loadDashboard();
        this.loadCourses();
        this.loadUsers();
        this.loadEnrollments();
        this.loadSettings();
        this.updateStats();
        this.showSection('dashboard');
    }

    bindLoginEvents() {
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    handleLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('login-error');

        if (username === this.adminCredentials.username && password === this.adminCredentials.password) {
            // 로그인 성공
            this.isAuthenticated = true;
            sessionStorage.setItem('admin_authenticated', 'true');
            this.showAdminDashboard();
            errorDiv.style.display = 'none';
        } else {
            // 로그인 실패
            errorDiv.style.display = 'block';
            document.getElementById('admin-password').value = '';
        }
    }

    bindDashboardEvents() {
        this.bindEvents();
        this.bindVideoUploadEvents();
        this.bindLessonEvents();
    }

    bindVideoUploadEvents() {
        const videoUploadArea = document.getElementById('video-upload-area');
        const videoFileInput = document.getElementById('video-file-input');

        if (videoUploadArea && videoFileInput) {
            // 클릭으로 파일 선택
            videoUploadArea.addEventListener('click', () => {
                videoFileInput.click();
            });

            // 파일 선택 이벤트
            videoFileInput.addEventListener('change', (e) => {
                this.handleVideoUpload(e.target.files[0]);
            });

            // 드래그 앤 드롭 이벤트
            videoUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                videoUploadArea.classList.add('drag-over');
            });

            videoUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                videoUploadArea.classList.remove('drag-over');
            });

            videoUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                videoUploadArea.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleVideoUpload(files[0]);
                }
            });
        }
    }

    handleVideoUpload(file) {
        if (!file) return;

        // 파일 크기 체크 (500MB)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('파일 크기가 너무 큽니다. 500MB 이하의 파일을 선택해주세요.');
            return;
        }

        // 비디오 파일인지 체크
        if (!file.type.startsWith('video/')) {
            alert('비디오 파일만 업로드할 수 있습니다.');
            return;
        }

        // 파일을 Base64로 변환하여 저장 (실제 환경에서는 서버에 업로드)
        const reader = new FileReader();
        reader.onload = (e) => {
            this.showVideoPreview(e.target.result, file);
        };
        reader.readAsDataURL(file);
    }

    showVideoPreview(videoData, file) {
        const videoUploadArea = document.getElementById('video-upload-area');
        const videoPreview = document.getElementById('video-preview');
        const videoPlayer = document.getElementById('video-preview-player');
        const videoFileName = document.getElementById('video-file-name');
        const videoFileSize = document.getElementById('video-file-size');

        // 업로드 영역 숨기고 미리보기 표시
        videoUploadArea.style.display = 'none';
        videoPreview.style.display = 'block';

        // 비디오 설정
        videoPlayer.src = videoData;
        videoFileName.textContent = `파일명: ${file.name}`;
        videoFileSize.textContent = `크기: ${this.formatFileSize(file.size)}`;

        // 현재 편집 중인 강좌에 비디오 정보 저장
        this.currentVideoData = {
            name: file.name,
            size: file.size,
            data: videoData,
            type: 'file'
        };
    }

    bindLessonEvents() {
        const lessonVideoUploadArea = document.getElementById('lesson-video-upload-area');
        const lessonVideoFileInput = document.getElementById('lesson-video-file-input');

        if (lessonVideoUploadArea && lessonVideoFileInput) {
            // 클릭으로 파일 선택
            lessonVideoUploadArea.addEventListener('click', () => {
                lessonVideoFileInput.click();
            });

            // 파일 선택 이벤트
            lessonVideoFileInput.addEventListener('change', (e) => {
                this.handleLessonVideoUpload(e.target.files[0]);
            });

            // 드래그 앤 드롭 이벤트
            lessonVideoUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                lessonVideoUploadArea.classList.add('drag-over');
            });

            lessonVideoUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                lessonVideoUploadArea.classList.remove('drag-over');
            });

            lessonVideoUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                lessonVideoUploadArea.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleLessonVideoUpload(files[0]);
                }
            });
        }
    }

    handleLessonVideoUpload(file) {
        if (!file) return;

        // 파일 크기 체크 (500MB)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('파일 크기가 너무 큽니다. 500MB 이하의 파일을 선택해주세요.');
            return;
        }

        // 비디오 파일인지 체크
        if (!file.type.startsWith('video/')) {
            alert('비디오 파일만 업로드할 수 있습니다.');
            return;
        }

        // 파일을 Base64로 변환하여 저장
        const reader = new FileReader();
        reader.onload = (e) => {
            this.showLessonVideoPreview(e.target.result, file);
        };
        reader.readAsDataURL(file);
    }

    showLessonVideoPreview(videoData, file) {
        const videoUploadArea = document.getElementById('lesson-video-upload-area');
        const videoPreview = document.getElementById('lesson-video-preview');
        const videoPlayer = document.getElementById('lesson-video-preview-player');
        const videoFileName = document.getElementById('lesson-video-file-name');
        const videoFileSize = document.getElementById('lesson-video-file-size');

        // 업로드 영역 숨기고 미리보기 표시
        videoUploadArea.style.display = 'none';
        videoPreview.style.display = 'block';

        // 비디오 설정
        videoPlayer.src = videoData;
        videoFileName.textContent = `파일명: ${file.name}`;
        videoFileSize.textContent = `크기: ${this.formatFileSize(file.size)}`;

        // 현재 편집 중인 차시에 비디오 정보 저장
        this.currentLessonVideoData = {
            name: file.name,
            size: file.size,
            data: videoData,
            type: 'file'
        };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getDefaultCourses() {
        return [
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
                status: "active",
                description: "JavaScript의 기본부터 고급 개념까지 체계적으로 학습할 수 있는 강좌입니다.",
                curriculum: ["JavaScript 기본 문법", "DOM 조작 및 이벤트 처리", "비동기 프로그래밍", "ES6+ 최신 문법", "실전 프로젝트"]
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
                status: "active",
                description: "React를 이용한 현대적인 웹 애플리케이션 개발을 배우는 강좌입니다.",
                curriculum: ["React 기본 개념", "컴포넌트와 Props", "State와 생명주기", "Hooks 활용", "Redux를 이용한 상태 관리"]
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
                status: "active",
                description: "사용자 중심의 디자인 사고와 실무에서 바로 활용할 수 있는 UI/UX 디자인 스킬을 배우는 강좌입니다.",
                curriculum: ["디자인 씽킹", "사용자 리서치", "와이어프레임 제작", "프로토타이핑", "사용성 테스트"]
            }
        ];
    }

    getDefaultSettings() {
        return {
            siteTitle: "EduPlatform",
            siteDescription: "최고 품질의 온라인 교육을 제공합니다.",
            contactEmail: "info@eduplatform.com",
            contactPhone: "02-1234-5678",
            heroTitle: "온라인으로 배우는 새로운 경험",
            heroSubtitle: "전문 강사진과 함께하는 체계적인 온라인 교육 플랫폼",
            heroButton: "강좌 둘러보기",
            facebookUrl: "",
            instagramUrl: "",
            youtubeUrl: "",
            smtpServer: "",
            smtpPort: "",
            senderEmail: ""
        };
    }

    bindEvents() {
        // 네비게이션 이벤트
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-item').getAttribute('data-section');
                this.showSection(section);
            });
        });

        // 검색 및 필터 이벤트
        document.getElementById('course-search')?.addEventListener('input', (e) => {
            this.filterCourses();
        });


        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.filterUsers();
        });

        document.getElementById('enrollment-search')?.addEventListener('input', (e) => {
            this.filterEnrollments();
        });

        // 강좌 폼 이벤트
        document.getElementById('course-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCourse();
        });

        // 차시 폼 이벤트
        document.getElementById('lesson-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveLesson();
        });

        // 모달 외부 클릭 이벤트
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    showSection(sectionId) {
        // 모든 섹션 숨기기
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // 선택된 섹션 보이기
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // 네비게이션 활성 상태 변경
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');

        // 페이지 제목 변경
        const titles = {
            'dashboard': '대시보드',
            'courses': '강좌 관리',
            'users': '사용자 관리',
            'enrollments': '수강신청 관리',
            'settings': '페이지 설정',
            'analytics': '통계 분석'
        };
        document.getElementById('page-title').textContent = titles[sectionId] || '관리자';

        // 설정 페이지일 때 설정 값들을 UI에 렌더링
        if (sectionId === 'settings') {
            console.log('📄 설정 페이지 진입 - 설정 렌더링 시작');
            // 약간의 지연을 두어 DOM이 완전히 준비되도록 함
            setTimeout(() => {
                console.log('🔍 showSection에서 renderSettings 함수 존재 확인:', typeof this.renderSettings);
                if (typeof this.renderSettings === 'function') {
                    this.renderSettings();
                } else {
                    console.error('❌ showSection: renderSettings 함수가 정의되지 않았습니다!');
                    console.log('AdminSystem 인스턴스:', this);
                    console.log('사용 가능한 메소드들:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
                }
            }, 100);
        }
    }

    updateStats() {
        document.getElementById('total-courses-stat').textContent = this.courses.length;
        document.getElementById('total-users-stat').textContent = this.users.length;
        document.getElementById('total-enrollments-stat').textContent = this.enrollments.length;
    }

    loadDashboard() {
        this.loadRecentEnrollments();
        this.loadPopularCourses();
    }

    loadRecentEnrollments() {
        const recentEnrollments = this.enrollments
            .slice(-5)
            .reverse()
            .map(enrollment => {
                const user = this.users.find(u => u.id === enrollment.userId);
                const course = this.courses.find(c => c.id === enrollment.courseId);
                return {
                    userName: user?.name || '알 수 없음',
                    courseName: course?.title || '알 수 없음',
                    date: this.formatDate(enrollment.enrolledAt)
                };
            });

        const container = document.getElementById('recent-enrollments');
        if (recentEnrollments.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">최근 수강신청이 없습니다.</p>';
        } else {
            container.innerHTML = recentEnrollments.map(item => `
                <div style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                    <strong>${item.userName}</strong>님이 <strong>${item.courseName}</strong> 수강신청
                    <br><small style="color: #666;">${item.date}</small>
                </div>
            `).join('');
        }
    }

    loadPopularCourses() {
        const popularCourses = this.courses
            .sort((a, b) => (b.students || 0) - (a.students || 0))
            .slice(0, 5);

        const container = document.getElementById('popular-courses');
        container.innerHTML = popularCourses.map(course => `
            <div style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                <strong>${course.title}</strong>
                <br><small style="color: #666;">수강생: ${course.students || 0}명</small>
            </div>
        `).join('');
    }

    loadCourses() {
        const tbody = document.getElementById('courses-table-body');
        tbody.innerHTML = this.courses.map(course => `
            <tr>
                <td>
                    <div class="course-title-cell">
                        ${course.title}
                        ${course.video ? '<span class="video-indicator">🎥</span>' : ''}
                    </div>
                </td>
                <td>${course.instructor}</td>
                <td>${course.students || 0}</td>
                <td><span class="status-badge status-${course.status || 'active'}">${course.status === 'active' ? '활성' : '비활성'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="admin.editCourse(${course.id})">편집</button>
                        <button class="btn btn-sm btn-danger" onclick="admin.deleteCourse(${course.id})">삭제</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadUsers() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = this.users.map(user => {
            const userEnrollments = this.enrollments.filter(e => e.userId === user.id);
            return `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${this.formatDate(user.registeredAt)}</td>
                    <td>${userEnrollments.length}</td>
                    <td><span class="status-badge status-active">활성</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-warning" onclick="admin.toggleUserStatus(${user.id})">상태변경</button>
                            <button class="btn btn-sm btn-danger" onclick="admin.deleteUser(${user.id})">삭제</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadEnrollments() {
        const tbody = document.getElementById('enrollments-table-body');
        tbody.innerHTML = this.enrollments.map(enrollment => {
            const user = this.users.find(u => u.id === enrollment.userId);
            const course = this.courses.find(c => c.id === enrollment.courseId);
            return `
                <tr>
                    <td>${user?.name || '알 수 없음'}</td>
                    <td>${course?.title || '알 수 없음'}</td>
                    <td>${this.formatDate(enrollment.enrolledAt)}</td>
                    <td>${this.getPaymentMethodName(enrollment.paymentMethod)}</td>
                    <td><span class="status-badge status-${enrollment.status || 'enrolled'}">${this.getEnrollmentStatusName(enrollment.status || 'enrolled')}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-success" onclick="admin.completeEnrollment(${enrollment.id})">완료</button>
                            <button class="btn btn-sm btn-danger" onclick="admin.cancelEnrollment(${enrollment.id})">취소</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadSettings() {
        console.log('📄 loadSettings() 호출됨 - renderSettings()로 전달');
        console.log('🔍 loadSettings에서 renderSettings 함수 존재 확인:', typeof this.renderSettings);
        if (typeof this.renderSettings === 'function') {
            this.renderSettings();
        } else {
            console.error('❌ loadSettings: renderSettings 함수가 정의되지 않았습니다!');
            console.log('AdminSystem 인스턴스:', this);
            console.log('사용 가능한 메소드들:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));

            // 폴백: 기존 방식으로 설정 로드
            console.log('🔄 폴백: 기존 방식으로 설정 로드');
            Object.keys(this.settings).forEach(key => {
                const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
                if (element) {
                    element.value = this.settings[key];
                    console.log(`✅ 폴백 로드: ${key} = ${this.settings[key]}`);
                }
            });
        }
    }


    getPaymentMethodName(method) {
        const methods = {
            'card': '신용카드',
            'bank': '무통장입금',
            'kakao': '카카오페이'
        };
        return methods[method] || method;
    }

    getEnrollmentStatusName(status) {
        const statuses = {
            'enrolled': '수강중',
            'completed': '완료',
            'cancelled': '취소'
        };
        return statuses[status] || status;
    }

    filterCourses() {
        const searchTerm = document.getElementById('course-search')?.value.toLowerCase() || '';

        const filteredCourses = this.courses.filter(course => {
            return course.title.toLowerCase().includes(searchTerm) ||
                   course.instructor.toLowerCase().includes(searchTerm);
        });

        const tbody = document.getElementById('courses-table-body');
        tbody.innerHTML = filteredCourses.map(course => `
            <tr>
                <td>
                    <div class="course-title-cell">
                        ${course.title}
                        ${course.video ? '<span class="video-indicator">🎥</span>' : ''}
                    </div>
                </td>
                <td>${course.instructor}</td>
                <td>${course.students || 0}</td>
                <td><span class="status-badge status-${course.status || 'active'}">${course.status === 'active' ? '활성' : '비활성'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="admin.editCourse(${course.id})">편집</button>
                        <button class="btn btn-sm btn-danger" onclick="admin.deleteCourse(${course.id})">삭제</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterUsers() {
        const searchTerm = document.getElementById('user-search')?.value.toLowerCase() || '';

        const filteredUsers = this.users.filter(user => {
            return user.name.toLowerCase().includes(searchTerm) ||
                   user.email.toLowerCase().includes(searchTerm);
        });

        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = filteredUsers.map(user => {
            const userEnrollments = this.enrollments.filter(e => e.userId === user.id);
            return `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${this.formatDate(user.registeredAt)}</td>
                    <td>${userEnrollments.length}</td>
                    <td><span class="status-badge status-active">활성</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-warning" onclick="admin.toggleUserStatus(${user.id})">상태변경</button>
                            <button class="btn btn-sm btn-danger" onclick="admin.deleteUser(${user.id})">삭제</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterEnrollments() {
        const searchTerm = document.getElementById('enrollment-search')?.value.toLowerCase() || '';

        const filteredEnrollments = this.enrollments.filter(enrollment => {
            const user = this.users.find(u => u.id === enrollment.userId);
            const course = this.courses.find(c => c.id === enrollment.courseId);
            return (user?.name.toLowerCase().includes(searchTerm)) ||
                   (course?.title.toLowerCase().includes(searchTerm));
        });

        const tbody = document.getElementById('enrollments-table-body');
        tbody.innerHTML = filteredEnrollments.map(enrollment => {
            const user = this.users.find(u => u.id === enrollment.userId);
            const course = this.courses.find(c => c.id === enrollment.courseId);
            return `
                <tr>
                    <td>${user?.name || '알 수 없음'}</td>
                    <td>${course?.title || '알 수 없음'}</td>
                    <td>${this.formatDate(enrollment.enrolledAt)}</td>
                    <td>${this.getPaymentMethodName(enrollment.paymentMethod)}</td>
                    <td><span class="status-badge status-${enrollment.status || 'enrolled'}">${this.getEnrollmentStatusName(enrollment.status || 'enrolled')}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-success" onclick="admin.completeEnrollment(${enrollment.id})">완료</button>
                            <button class="btn btn-sm btn-danger" onclick="admin.cancelEnrollment(${enrollment.id})">취소</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showAddCourseModal() {
        this.currentEditingCourse = null;
        document.getElementById('course-modal-title').textContent = '새 강좌 추가';
        document.getElementById('course-form').reset();
        document.getElementById('course-modal').style.display = 'block';
    }

    editCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        this.currentEditingCourse = course;
        document.getElementById('course-modal-title').textContent = '강좌 편집';

        // 폼 필드 채우기
        document.getElementById('course-title-input').value = course.title;
        document.getElementById('course-instructor-input').value = course.instructor;
        document.getElementById('course-duration-input').value = course.duration;
        document.getElementById('course-level-input').value = course.level;
        document.getElementById('course-description-input').value = course.description;
        document.getElementById('course-curriculum-input').value = course.curriculum.join('\n');

        // 영상 정보가 있으면 폼에 설정
        if (course.video) {
            if (course.video.type === 'url') {
                document.getElementById('video-url-input').value = course.video.url;
            } else if (course.video.type === 'file') {
                // 파일이 있는 경우 미리보기 표시
                this.showExistingVideo(course.video);
            }
        }

        // 차시 목록 로드
        this.loadLessons();

        document.getElementById('course-modal').style.display = 'block';
    }

    showExistingVideo(videoData) {
        if (videoData.type === 'file' && videoData.data) {
            const videoUploadArea = document.getElementById('video-upload-area');
            const videoPreview = document.getElementById('video-preview');
            const videoPlayer = document.getElementById('video-preview-player');
            const videoFileName = document.getElementById('video-file-name');
            const videoFileSize = document.getElementById('video-file-size');

            videoUploadArea.style.display = 'none';
            videoPreview.style.display = 'block';

            videoPlayer.src = videoData.data;
            videoFileName.textContent = `파일명: ${videoData.name}`;
            videoFileSize.textContent = `크기: ${this.formatFileSize(videoData.size)}`;

            this.currentVideoData = videoData;
        }
    }

    async saveCourse() {
        const videoUrl = document.getElementById('video-url-input')?.value || '';

        // 영상 데이터 수집
        let videoData = null;
        if (this.currentVideoData) {
            videoData = this.currentVideoData;
        } else if (videoUrl) {
            videoData = {
                url: videoUrl,
                type: 'url'
            };
        }

        const formData = {
            title: document.getElementById('course-title-input').value,
            instructor: document.getElementById('course-instructor-input').value,
            duration: document.getElementById('course-duration-input').value,
            level: document.getElementById('course-level-input').value,
            description: document.getElementById('course-description-input').value,
            curriculum: document.getElementById('course-curriculum-input').value.split('\n').filter(item => item.trim()),
            video: videoData
        };

        let courseToSave;
        if (this.currentEditingCourse) {
            // 기존 강좌 수정
            courseToSave = { ...this.currentEditingCourse, ...formData };
        } else {
            // 새 강좌 추가
            courseToSave = {
                id: Date.now(),
                ...formData,
                rating: 0,
                students: 0,
                status: 'active'
            };
        }

        try {
            console.log('💾 강좌 저장 시작:', courseToSave);

            // Firebase에 저장
            if (this.isFirebaseReady) {
                const result = await firebaseService.saveCourse(courseToSave);

                if (result.success) {
                    console.log('✅ Firebase 강좌 저장 성공');
                } else {
                    console.error('❌ Firebase 강좌 저장 실패:', result.error);
                    throw new Error(result.error || 'Firebase 저장 실패');
                }
            } else {
                console.log('💾 localStorage 모드 - 로컬 저장만 수행');
            }

            // 로컬 배열 업데이트
            if (this.currentEditingCourse) {
                const index = this.courses.findIndex(c => c.id === this.currentEditingCourse.id);
                this.courses[index] = courseToSave;
            } else {
                this.courses.push(courseToSave);
            }

            // localStorage 백업
            this.saveData();

            this.loadCourses();
            this.updateStats();
            this.closeCourseModal();

            alert(this.currentEditingCourse ? '강좌가 수정되었습니다.' : '새 강좌가 추가되었습니다.');

        } catch (error) {
            console.error('강좌 저장 오류:', error);
            alert('강좌 저장 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 차시 관리 기능들
    addNewLesson() {
        this.currentEditingLesson = null;
        this.resetLessonVideoUpload();
        document.getElementById('lesson-modal-title').textContent = '새 차시 추가';
        document.getElementById('lesson-form').reset();
        document.getElementById('lesson-modal').style.display = 'block';
    }

    editLesson(lessonId) {
        if (!this.currentEditingCourse || !this.currentEditingCourse.lessons) return;

        const lesson = this.currentEditingCourse.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        this.currentEditingLesson = lesson;
        document.getElementById('lesson-modal-title').textContent = '차시 편집';

        // 폼 필드 채우기
        document.getElementById('lesson-title-input').value = lesson.title;
        document.getElementById('lesson-order-input').value = lesson.order;
        document.getElementById('lesson-description-input').value = lesson.description;
        document.getElementById('lesson-duration-input').value = lesson.duration;

        // 영상 정보가 있으면 폼에 설정
        if (lesson.video) {
            if (lesson.video.type === 'url') {
                document.getElementById('lesson-video-url-input').value = lesson.video.url;
            } else if (lesson.video.type === 'file') {
                // 파일이 있는 경우 미리보기 표시
                this.showExistingLessonVideo(lesson.video);
            }
        }

        document.getElementById('lesson-modal').style.display = 'block';
    }

    showExistingLessonVideo(videoData) {
        if (videoData.type === 'file' && videoData.data) {
            const videoUploadArea = document.getElementById('lesson-video-upload-area');
            const videoPreview = document.getElementById('lesson-video-preview');
            const videoPlayer = document.getElementById('lesson-video-preview-player');
            const videoFileName = document.getElementById('lesson-video-file-name');
            const videoFileSize = document.getElementById('lesson-video-file-size');

            videoUploadArea.style.display = 'none';
            videoPreview.style.display = 'block';

            videoPlayer.src = videoData.data;
            videoFileName.textContent = `파일명: ${videoData.name}`;
            videoFileSize.textContent = `크기: ${this.formatFileSize(videoData.size)}`;

            this.currentLessonVideoData = videoData;
        }
    }

    async saveLesson() {
        const videoUrl = document.getElementById('lesson-video-url-input').value;

        // 영상 데이터 수집
        let videoData = null;
        if (this.currentLessonVideoData) {
            videoData = this.currentLessonVideoData;
        } else if (videoUrl) {
            videoData = {
                url: videoUrl,
                type: 'url'
            };
        }

        const formData = {
            title: document.getElementById('lesson-title-input').value,
            order: parseInt(document.getElementById('lesson-order-input').value) || 1,
            description: document.getElementById('lesson-description-input').value,
            duration: document.getElementById('lesson-duration-input').value,
            video: videoData
        };

        // 강좌에 lessons 배열이 없으면 생성
        if (!this.currentEditingCourse.lessons) {
            this.currentEditingCourse.lessons = [];
        }

        if (this.currentEditingLesson) {
            // 기존 차시 수정
            const index = this.currentEditingCourse.lessons.findIndex(l => l.id === this.currentEditingLesson.id);
            this.currentEditingCourse.lessons[index] = { ...this.currentEditingLesson, ...formData };
        } else {
            // 새 차시 추가
            const newLesson = {
                id: Date.now(),
                ...formData
            };
            this.currentEditingCourse.lessons.push(newLesson);
        }

        // 차시를 순서대로 정렬
        this.currentEditingCourse.lessons.sort((a, b) => a.order - b.order);

        // 강좌 정보 업데이트
        const courseIndex = this.courses.findIndex(c => c.id === this.currentEditingCourse.id);
        if (courseIndex !== -1) {
            this.courses[courseIndex] = this.currentEditingCourse;
        }

        try {
            // Firebase에 강좌 업데이트 저장 (차시 포함)
            if (this.isFirebaseReady) {
                const result = await firebaseService.saveCourse(this.currentEditingCourse);
                if (!result.success) {
                    throw new Error(result.error || 'Firebase 저장 실패');
                }
                console.log('✅ Firebase 차시 저장 성공');
            }

            // localStorage 백업
            this.saveData();
            this.loadLessons();
            this.closeLessonModal();

            alert(this.currentEditingLesson ? '차시가 수정되었습니다.' : '새 차시가 추가되었습니다.');

        } catch (error) {
            console.error('차시 저장 오류:', error);
            alert('차시 저장 중 오류가 발생했습니다: ' + error.message);
        }
    }

    async deleteLesson(lessonId) {
        if (confirm('이 차시를 삭제하시겠습니까?')) {
            if (this.currentEditingCourse && this.currentEditingCourse.lessons) {
                this.currentEditingCourse.lessons = this.currentEditingCourse.lessons.filter(l => l.id !== lessonId);

                // 강좌 정보 업데이트
                const courseIndex = this.courses.findIndex(c => c.id === this.currentEditingCourse.id);
                if (courseIndex !== -1) {
                    this.courses[courseIndex] = this.currentEditingCourse;
                }

                try {
                    // Firebase에 업데이트 저장
                    if (this.isFirebaseReady) {
                        const result = await firebaseService.saveCourse(this.currentEditingCourse);
                        if (!result.success) {
                            throw new Error(result.error || 'Firebase 저장 실패');
                        }
                        console.log('✅ Firebase 차시 삭제 성공');
                    }

                    // localStorage 백업
                    this.saveData();
                    this.loadLessons();
                    alert('차시가 삭제되었습니다.');

                } catch (error) {
                    console.error('차시 삭제 오류:', error);
                    alert('차시 삭제 중 오류가 발생했습니다: ' + error.message);
                }
            }
        }
    }

    loadLessons() {
        const container = document.getElementById('lessons-list');
        if (!this.currentEditingCourse || !this.currentEditingCourse.lessons || this.currentEditingCourse.lessons.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">등록된 차시가 없습니다.</p>';
            return;
        }

        // 차시를 순서대로 정렬
        const sortedLessons = [...this.currentEditingCourse.lessons].sort((a, b) => a.order - b.order);

        container.innerHTML = sortedLessons.map(lesson => `
            <div class="lesson-item">
                <div class="lesson-info">
                    <div class="lesson-header">
                        <h4>${lesson.order}차시. ${lesson.title}</h4>
                        ${lesson.video ? '<span class="video-indicator">🎥</span>' : ''}
                    </div>
                    <p class="lesson-description">${lesson.description || ''}</p>
                    <div class="lesson-meta">
                        <span>재생시간: ${lesson.duration || '미정'}</span>
                    </div>
                </div>
                <div class="lesson-actions">
                    <button class="btn btn-sm btn-primary" onclick="admin.editLesson(${lesson.id})">편집</button>
                    <button class="btn btn-sm btn-danger" onclick="admin.deleteLesson(${lesson.id})">삭제</button>
                </div>
            </div>
        `).join('');
    }

    closeLessonModal() {
        document.getElementById('lesson-modal').style.display = 'none';
        this.currentEditingLesson = null;
        this.resetLessonVideoUpload();
    }

    resetLessonVideoUpload() {
        // 차시 비디오 업로드 상태 초기화
        this.currentLessonVideoData = null;
        const videoUploadArea = document.getElementById('lesson-video-upload-area');
        const videoPreview = document.getElementById('lesson-video-preview');
        const videoUrlInput = document.getElementById('lesson-video-url-input');
        const videoFileInput = document.getElementById('lesson-video-file-input');

        if (videoUploadArea) videoUploadArea.style.display = 'block';
        if (videoPreview) videoPreview.style.display = 'none';
        if (videoUrlInput) videoUrlInput.value = '';
        if (videoFileInput) videoFileInput.value = '';
    }


    async deleteCourse(courseId) {
        if (confirm('이 강좌를 삭제하시겠습니까?')) {
            try {
                // Firebase에서 삭제
                if (this.isFirebaseReady) {
                    const result = await firebaseService.deleteCourse(courseId);
                    if (!result.success) {
                        throw new Error(result.error || 'Firebase 삭제 실패');
                    }
                    console.log('✅ Firebase 강좌 삭제 성공');
                }

                // 로컬 배열에서 삭제
                this.courses = this.courses.filter(c => c.id !== courseId);

                // localStorage 백업
                this.saveData();
                this.loadCourses();
                this.updateStats();
                alert('강좌가 삭제되었습니다.');

            } catch (error) {
                console.error('강좌 삭제 오류:', error);
                alert('강좌 삭제 중 오류가 발생했습니다: ' + error.message);
            }
        }
    }

    deleteUser(userId) {
        if (confirm('이 사용자를 삭제하시겠습니까?')) {
            this.users = this.users.filter(u => u.id !== userId);
            this.enrollments = this.enrollments.filter(e => e.userId !== userId);
            this.saveData();
            this.loadUsers();
            this.loadEnrollments();
            this.updateStats();
            alert('사용자가 삭제되었습니다.');
        }
    }

    toggleUserStatus(userId) {
        alert('사용자 상태가 변경되었습니다.');
    }

    completeEnrollment(enrollmentId) {
        const enrollment = this.enrollments.find(e => e.id === enrollmentId);
        if (enrollment) {
            enrollment.status = 'completed';
            this.saveData();
            this.loadEnrollments();
            alert('수강신청이 완료 처리되었습니다.');
        }
    }

    cancelEnrollment(enrollmentId) {
        if (confirm('이 수강신청을 취소하시겠습니까?')) {
            const enrollment = this.enrollments.find(e => e.id === enrollmentId);
            if (enrollment) {
                enrollment.status = 'cancelled';
                this.saveData();
                this.loadEnrollments();
                alert('수강신청이 취소되었습니다.');
            }
        }
    }

    async deleteAllCourses() {
        if (!confirm('⚠️ 경고: 모든 강좌를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!')) {
            return;
        }

        if (!confirm('정말로 모든 강좌를 삭제하시겠습니까?\n\nFirebase와 로컬 저장소의 모든 강좌 데이터가 삭제됩니다.')) {
            return;
        }

        try {
            console.log('🗑️ 모든 강좌 삭제 시작...');

            // Firebase에서 모든 강좌 삭제
            if (this.isFirebaseReady && typeof db !== 'undefined') {
                console.log('🔥 Firebase에서 강좌 삭제 중...');
                const snapshot = await db.collection('courses').get();
                console.log(`삭제할 강좌 수: ${snapshot.size}`);

                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log('✅ Firebase 강좌 삭제 완료');
            }

            // 로컬 배열 초기화
            this.courses = [];

            // localStorage 삭제
            localStorage.removeItem('lms_courses');
            console.log('✅ localStorage 강좌 삭제 완료');

            // UI 업데이트
            this.loadCourses();
            this.updateStats();

            alert('✅ 모든 강좌가 삭제되었습니다!');

        } catch (error) {
            console.error('❌ 강좌 삭제 오류:', error);
            alert('강좌 삭제 중 오류가 발생했습니다: ' + error.message);
        }
    }

    async saveSettings() {
        console.log('⚙️ 설정 저장 시작...');
        console.log('Firebase 상태:', this.isFirebaseReady);

        try {
            // 설정 값들 수집
            const newSettings = {
                siteTitle: document.getElementById('site-title').value,
                siteDescription: document.getElementById('site-description').value,
                contactEmail: document.getElementById('contact-email').value,
                contactPhone: document.getElementById('contact-phone').value,
                heroTitle: document.getElementById('hero-title').value,
                heroSubtitle: document.getElementById('hero-subtitle').value,
                heroButton: document.getElementById('hero-button').value,
                facebookUrl: document.getElementById('facebook-url').value,
                instagramUrl: document.getElementById('instagram-url').value,
                youtubeUrl: document.getElementById('youtube-url').value,
                smtpServer: document.getElementById('smtp-server').value,
                smtpPort: document.getElementById('smtp-port').value,
                senderEmail: document.getElementById('sender-email').value
            };

            console.log('💾 저장할 설정 데이터:', newSettings);

            let saveSuccess = false;
            let saveMethod = '';

            // Firebase에 저장 시도
            if (this.isFirebaseReady && typeof firebaseService !== 'undefined') {
                console.log('🔥 Firebase로 설정 저장 시도...');
                try {
                    const result = await firebaseService.saveSettings(newSettings);
                    console.log('Firebase 저장 결과:', result);

                    if (result.success) {
                        saveSuccess = true;
                        saveMethod = 'Firebase';
                        console.log('✅ Firebase 설정 저장 성공');
                    } else {
                        console.log('❌ Firebase 설정 저장 실패:', result.error || 'Unknown error');
                    }
                } catch (firebaseError) {
                    console.error('Firebase 설정 저장 오류:', firebaseError);
                }
            }

            // Firebase 실패 시 localStorage 폴백
            if (!saveSuccess) {
                console.log('💾 localStorage로 설정 저장...');
                try {
                    localStorage.setItem('lms_settings', JSON.stringify(newSettings));
                    saveSuccess = true;
                    saveMethod = 'localStorage';
                    console.log('✅ localStorage 설정 저장 성공');
                } catch (localError) {
                    console.error('localStorage 설정 저장 오류:', localError);
                }
            }

            if (saveSuccess) {
                this.settings = newSettings;
                console.log(`🎉 설정 저장 완료 (${saveMethod})`);

                // 성공 메시지 표시
                this.showSaveSuccess(`설정이 저장되었습니다! (${saveMethod})`);

                // 설정 페이지 새로고침 (저장된 값 표시)
                console.log('🔍 renderSettings 함수 존재 확인:', typeof this.renderSettings);
                if (typeof this.renderSettings === 'function') {
                    this.renderSettings();
                } else {
                    console.error('❌ renderSettings 함수가 정의되지 않았습니다!');
                    console.log('사용 가능한 메소드들:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)));
                    alert('설정이 저장되었지만 UI 새로고침에 실패했습니다. 페이지를 새로고침해주세요.');
                }
            } else {
                console.log('❌ 모든 저장 방법 실패');
                alert('설정 저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
            }

        } catch (error) {
            console.error('설정 저장 전체 오류:', error);
            alert('설정 저장 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 저장 성공 메시지 표시
    showSaveSuccess(message) {
        // 기존 알림 제거
        const existingAlert = document.querySelector('.save-success-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 성공 알림 생성
        const alert = document.createElement('div');
        alert.className = 'save-success-alert';
        alert.style.cssText = `
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
        alert.textContent = message;

        document.body.appendChild(alert);

        // 3초 후 제거
        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    // 설정 값들을 UI에 렌더링
    renderSettings() {
        console.log('🔄 설정 UI 새로고침 시작...');
        console.log('현재 설정 데이터:', this.settings);

        try {
            // 각 설정 필드에 값 설정
            const settingsFields = {
                'site-title': this.settings.siteTitle || '',
                'site-description': this.settings.siteDescription || '',
                'contact-email': this.settings.contactEmail || '',
                'contact-phone': this.settings.contactPhone || '',
                'hero-title': this.settings.heroTitle || '',
                'hero-subtitle': this.settings.heroSubtitle || '',
                'hero-button': this.settings.heroButton || '',
                'facebook-url': this.settings.facebookUrl || '',
                'instagram-url': this.settings.instagramUrl || '',
                'youtube-url': this.settings.youtubeUrl || '',
                'smtp-server': this.settings.smtpServer || '',
                'smtp-port': this.settings.smtpPort || '',
                'sender-email': this.settings.senderEmail || ''
            };

            // DOM 요소에 값 설정
            for (const [fieldId, value] of Object.entries(settingsFields)) {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = value;
                    console.log(`✅ ${fieldId}: "${value}"`);
                } else {
                    console.warn(`⚠️ 설정 필드를 찾을 수 없음: ${fieldId}`);
                }
            }

            console.log('✅ 설정 UI 새로고침 완료');

        } catch (error) {
            console.error('❌ 설정 UI 새로고침 오류:', error);
        }
    }

    closeCourseModal() {
        document.getElementById('course-modal').style.display = 'none';
        this.currentEditingCourse = null;
        this.resetVideoUpload();
    }

    resetVideoUpload() {
        // 비디오 업로드 상태 초기화
        this.currentVideoData = null;
        const videoUploadArea = document.getElementById('video-upload-area');
        const videoPreview = document.getElementById('video-preview');
        const videoUrlInput = document.getElementById('video-url-input');
        const videoFileInput = document.getElementById('video-file-input');

        if (videoUploadArea) videoUploadArea.style.display = 'block';
        if (videoPreview) videoPreview.style.display = 'none';
        if (videoUrlInput) videoUrlInput.value = '';
        if (videoFileInput) videoFileInput.value = '';
    }

    exportUsers() {
        const csvContent = this.generateUserCSV();
        this.downloadCSV(csvContent, 'users.csv');
    }

    exportEnrollments() {
        const csvContent = this.generateEnrollmentCSV();
        this.downloadCSV(csvContent, 'enrollments.csv');
    }

    generateUserCSV() {
        const headers = ['이름', '이메일', '전화번호', '가입일', '수강강좌수'];
        const rows = this.users.map(user => [
            user.name,
            user.email,
            user.phone || '',
            new Date(user.registeredAt).toLocaleDateString('ko-KR'),
            this.enrollments.filter(e => e.userId === user.id).length
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    generateEnrollmentCSV() {
        const headers = ['학생명', '강좌명', '신청일', '결제방법', '상태'];
        const rows = this.enrollments.map(enrollment => {
            const user = this.users.find(u => u.id === enrollment.userId);
            const course = this.courses.find(c => c.id === enrollment.courseId);
            return [
                user?.name || '알 수 없음',
                course?.title || '알 수 없음',
                this.formatDate(enrollment.enrolledAt),
                this.getPaymentMethodName(enrollment.paymentMethod),
                this.getEnrollmentStatusName(enrollment.status || 'enrolled')
            ];
        });

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    saveData() {
        localStorage.setItem('lms_courses', JSON.stringify(this.courses));
        localStorage.setItem('lms_users', JSON.stringify(this.users));
        localStorage.setItem('lms_enrollments', JSON.stringify(this.enrollments));
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('show');
    }

    formatDate(dateValue) {
        if (!dateValue) return '-';

        try {
            // Firebase Timestamp 객체인 경우
            if (dateValue && typeof dateValue.toDate === 'function') {
                return dateValue.toDate().toLocaleDateString('ko-KR');
            }
            // Firestore Timestamp 객체 (seconds, nanoseconds)
            if (dateValue && dateValue.seconds) {
                return new Date(dateValue.seconds * 1000).toLocaleDateString('ko-KR');
            }
            // ISO 문자열이나 일반 날짜
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('ko-KR');
            }
        } catch (error) {
            console.error('날짜 변환 오류:', error, dateValue);
        }

        return '-';
    }

    setupRealtimeListeners() {
        if (!this.isFirebaseReady || typeof db === 'undefined') {
            console.warn('⚠️ Firebase가 준비되지 않아 실시간 리스너를 설정할 수 없습니다.');
            return;
        }

        if (this.listenersSetup) {
            console.log('ℹ️ Firebase 실시간 리스너가 이미 설정되어 있습니다.');
            return;
        }

        console.log('🔔 Admin Firebase 실시간 리스너 설정 중...');
        this.listenersSetup = true;

        try {
            // 강좌 데이터 실시간 리스너
            db.collection('courses').onSnapshot((snapshot) => {
                console.log('🔄 [Admin] 강좌 데이터 실시간 업데이트 감지');

                const updatedCourses = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    firebaseId: doc.id
                }));

                if (JSON.stringify(this.courses) !== JSON.stringify(updatedCourses)) {
                    console.log('📚 [Admin] 강좌 데이터 변경됨 - 테이블 업데이트');
                    this.courses = updatedCourses;
                    localStorage.setItem('lms_courses', JSON.stringify(this.courses));
                    this.loadCourses();
                }
            }, (error) => {
                console.error('[Admin] 강좌 실시간 리스너 오류:', error);
            });

            // 사용자 데이터 실시간 리스너
            db.collection('users').onSnapshot((snapshot) => {
                console.log('🔄 [Admin] 사용자 데이터 실시간 업데이트 감지');

                const updatedUsers = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    firebaseId: doc.id
                }));

                if (JSON.stringify(this.users) !== JSON.stringify(updatedUsers)) {
                    console.log('👥 [Admin] 사용자 데이터 변경됨 - 테이블 업데이트');
                    this.users = updatedUsers;
                    localStorage.setItem('lms_users', JSON.stringify(this.users));
                    this.loadUsers();
                }
            }, (error) => {
                console.error('[Admin] 사용자 실시간 리스너 오류:', error);
            });

            // 수강신청 데이터 실시간 리스너
            db.collection('enrollments').onSnapshot((snapshot) => {
                console.log('🔄 [Admin] 수강신청 데이터 실시간 업데이트 감지');

                const updatedEnrollments = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    firebaseId: doc.id
                }));

                if (JSON.stringify(this.enrollments) !== JSON.stringify(updatedEnrollments)) {
                    console.log('🎓 [Admin] 수강신청 데이터 변경됨 - 테이블 업데이트');
                    this.enrollments = updatedEnrollments;
                    localStorage.setItem('lms_enrollments', JSON.stringify(this.enrollments));
                    this.loadEnrollments();
                }
            }, (error) => {
                console.error('[Admin] 수강신청 실시간 리스너 오류:', error);
            });

            // 설정 데이터 실시간 리스너
            db.collection('settings').doc('main').onSnapshot((doc) => {
                console.log('🔄 [Admin] 설정 데이터 실시간 업데이트 감지');

                if (doc.exists) {
                    const updatedSettings = doc.data();
                    console.log('⚙️ [Admin] 설정 데이터 변경됨:', updatedSettings);

                    this.settings = { ...this.getDefaultSettings(), ...updatedSettings };
                    localStorage.setItem('lms_settings', JSON.stringify(this.settings));
                    this.loadSettings();
                }
            }, (error) => {
                console.error('[Admin] 설정 실시간 리스너 오류:', error);
            });

            console.log('✅ [Admin] Firebase 실시간 리스너 설정 완료');

        } catch (error) {
            console.error('[Admin] Firebase 리스너 설정 오류:', error);
        }
    }
}

// 전역 함수들
function showAddCourseModal() {
    admin.showAddCourseModal();
}

function closeCourseModal() {
    admin.closeCourseModal();
}

function saveSettings() {
    admin.saveSettings();
}

function exportUsers() {
    admin.exportUsers();
}

function exportEnrollments() {
    admin.exportEnrollments();
}

function goToMainSite() {
    window.open('lms.html', '_blank');
}

function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        sessionStorage.removeItem('admin_authenticated');
        window.location.reload();
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

function removeVideo() {
    admin.resetVideoUpload();
}

function changeVideo() {
    document.getElementById('video-file-input').click();
}

// 차시 관리 전역 함수들
function addNewLesson() {
    admin.addNewLesson();
}

function closeLessonModal() {
    admin.closeLessonModal();
}

function saveLesson() {
    admin.saveLesson();
}

function removeLessonVideo() {
    admin.resetLessonVideoUpload();
}

function changeLessonVideo() {
    document.getElementById('lesson-video-file-input').click();
}

// 관리자 시스템 초기화
const admin = new AdminSystem();

// 페이지 로드 완료 후 추가 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('관리자 시스템이 초기화되었습니다.');

    // 반응형 사이드바 처리
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('open');
    }

    // 관리자 디버그 도구 추가
    window.adminDebug = {
        getFirebaseStatus: () => {
            console.log('=== 관리자 Firebase 상태 ===');
            console.log('admin.isFirebaseReady:', admin.isFirebaseReady);
            console.log('firebaseService.isFirebaseReady:', firebaseService?.isFirebaseReady);
            console.log('window.firebaseServiceReady:', window.firebaseServiceReady);
            console.log('window.firebaseServiceMode:', window.firebaseServiceMode);
            console.log('Firebase 서비스 객체:', typeof firebaseService);
            return {
                adminReady: admin.isFirebaseReady,
                serviceReady: firebaseService?.isFirebaseReady,
                windowReady: window.firebaseServiceReady,
                mode: window.firebaseServiceMode
            };
        },

        testSettingsSave: async () => {
            console.log('=== 설정 저장 테스트 ===');
            const testSettings = {
                siteTitle: 'Test Title ' + Date.now(),
                siteDescription: 'Test Description',
                contactEmail: 'test@example.com',
                contactPhone: '010-1234-5678'
            };

            console.log('테스트 설정 데이터:', testSettings);

            try {
                if (firebaseService && admin.isFirebaseReady) {
                    const result = await firebaseService.saveSettings(testSettings);
                    console.log('Firebase 저장 결과:', result);
                    return result;
                } else {
                    console.log('Firebase 비활성화 - localStorage 테스트');
                    localStorage.setItem('lms_settings', JSON.stringify(testSettings));
                    return { success: true, method: 'localStorage' };
                }
            } catch (error) {
                console.error('설정 저장 테스트 오류:', error);
                return { success: false, error: error.message };
            }
        },

        checkSettingsElements: () => {
            console.log('=== 설정 폼 요소 확인 ===');
            const elements = {
                siteTitle: document.getElementById('site-title'),
                siteDescription: document.getElementById('site-description'),
                contactEmail: document.getElementById('contact-email'),
                contactPhone: document.getElementById('contact-phone')
            };

            for (const [key, element] of Object.entries(elements)) {
                console.log(`${key}:`, element ? `값="${element.value}"` : '요소 없음');
            }
            return elements;
        },

        getCurrentSettings: () => {
            console.log('=== 현재 설정 확인 ===');
            console.log('admin.settings:', admin.settings);

            if (admin.isFirebaseReady) {
                firebaseService.getSettings().then(settings => {
                    console.log('Firebase 설정:', settings);
                });
            }

            const localSettings = JSON.parse(localStorage.getItem('lms_settings') || '{}');
            console.log('localStorage 설정:', localSettings);

            return {
                admin: admin.settings,
                localStorage: localSettings
            };
        },

        refreshData: async () => {
            console.log('=== 데이터 새로고침 ===');
            try {
                await admin.loadData();
                console.log('✅ 데이터 새로고침 완료');
                console.log('새로운 설정:', admin.settings);
            } catch (error) {
                console.error('❌ 데이터 새로고침 실패:', error);
            }
        }
    };

    console.log('🔧 관리자 디버그 도구가 추가되었습니다. adminDebug 객체를 사용하세요.');
});

// 윈도우 리사이즈 이벤트
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('open');
    }
});