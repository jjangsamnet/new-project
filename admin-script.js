// 관리자 시스템 JavaScript

class AdminSystem {
    constructor() {
        this.courses = JSON.parse(localStorage.getItem('lms_courses')) || this.getDefaultCourses();
        this.users = JSON.parse(localStorage.getItem('lms_users')) || [];
        this.enrollments = JSON.parse(localStorage.getItem('lms_enrollments')) || [];
        this.settings = JSON.parse(localStorage.getItem('lms_settings')) || this.getDefaultSettings();
        this.currentEditingCourse = null;
        this.currentEditingLesson = null;
        this.isAuthenticated = false;

        // 관리자 계정 정보
        this.adminCredentials = {
            username: 'jjangsam',
            password: '16181618wkd'
        };

        this.init();
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

    showAdminDashboard() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        this.bindDashboardEvents();
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

        document.getElementById('category-filter')?.addEventListener('change', (e) => {
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
                    date: new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')
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
                <td>${this.getCategoryName(course.category)}</td>
                <td>${course.instructor}</td>
                <td>${course.price}</td>
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
                    <td>${new Date(user.registeredAt).toLocaleDateString('ko-KR')}</td>
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
                    <td>${new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')}</td>
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
        Object.keys(this.settings).forEach(key => {
            const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (element) {
                element.value = this.settings[key];
            }
        });
    }

    getCategoryName(category) {
        const categories = {
            'programming': '프로그래밍',
            'design': '디자인',
            'business': '비즈니스',
            'language': '언어'
        };
        return categories[category] || category;
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
        const categoryFilter = document.getElementById('category-filter')?.value || '';

        const filteredCourses = this.courses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchTerm) ||
                                course.instructor.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || course.category === categoryFilter;
            return matchesSearch && matchesCategory;
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
                <td>${this.getCategoryName(course.category)}</td>
                <td>${course.instructor}</td>
                <td>${course.price}</td>
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
                    <td>${new Date(user.registeredAt).toLocaleDateString('ko-KR')}</td>
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
                    <td>${new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR')}</td>
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
        document.getElementById('course-category-input').value = course.category;
        document.getElementById('course-instructor-input').value = course.instructor;
        document.getElementById('course-price-input').value = course.price;
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

    saveCourse() {
        const videoUrl = document.getElementById('video-url-input').value;

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
            category: document.getElementById('course-category-input').value,
            instructor: document.getElementById('course-instructor-input').value,
            price: document.getElementById('course-price-input').value,
            duration: document.getElementById('course-duration-input').value,
            level: document.getElementById('course-level-input').value,
            description: document.getElementById('course-description-input').value,
            curriculum: document.getElementById('course-curriculum-input').value.split('\n').filter(item => item.trim()),
            video: videoData
        };

        if (this.currentEditingCourse) {
            // 기존 강좌 수정
            const index = this.courses.findIndex(c => c.id === this.currentEditingCourse.id);
            this.courses[index] = { ...this.currentEditingCourse, ...formData };
        } else {
            // 새 강좌 추가
            const newCourse = {
                id: Date.now(),
                ...formData,
                rating: 0,
                students: 0,
                status: 'active'
            };
            this.courses.push(newCourse);
        }

        this.saveData();
        this.loadCourses();
        this.updateStats();
        this.closeCourseModal();

        alert(this.currentEditingCourse ? '강좌가 수정되었습니다.' : '새 강좌가 추가되었습니다.');
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

    saveLesson() {
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

        this.saveData();
        this.loadLessons();
        this.closeLessonModal();

        alert(this.currentEditingLesson ? '차시가 수정되었습니다.' : '새 차시가 추가되었습니다.');
    }

    deleteLesson(lessonId) {
        if (confirm('이 차시를 삭제하시겠습니까?')) {
            if (this.currentEditingCourse && this.currentEditingCourse.lessons) {
                this.currentEditingCourse.lessons = this.currentEditingCourse.lessons.filter(l => l.id !== lessonId);

                // 강좌 정보 업데이트
                const courseIndex = this.courses.findIndex(c => c.id === this.currentEditingCourse.id);
                if (courseIndex !== -1) {
                    this.courses[courseIndex] = this.currentEditingCourse;
                }

                this.saveData();
                this.loadLessons();
                alert('차시가 삭제되었습니다.');
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

    showAddCourseModal() {
        this.currentEditingCourse = null;
        this.resetVideoUpload();
        document.getElementById('course-modal-title').textContent = '새 강좌 추가';
        document.getElementById('course-form').reset();
        document.getElementById('course-modal').style.display = 'block';
    }

    deleteCourse(courseId) {
        if (confirm('이 강좌를 삭제하시겠습니까?')) {
            this.courses = this.courses.filter(c => c.id !== courseId);
            this.saveData();
            this.loadCourses();
            this.updateStats();
            alert('강좌가 삭제되었습니다.');
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

    saveSettings() {
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

        this.settings = newSettings;
        localStorage.setItem('lms_settings', JSON.stringify(this.settings));
        alert('설정이 저장되었습니다.');
    }

    closeCourseModal() {
        document.getElementById('course-modal').style.display = 'none';
        this.currentEditingCourse = null;
        this.resetVideoUpload();
    }

    resetVideoUpload() {
        // 비디오 업로드 상태 초기화
        this.currentVideoData = null;
        document.getElementById('video-upload-area').style.display = 'block';
        document.getElementById('video-preview').style.display = 'none';
        document.getElementById('video-url-input').value = '';
        document.getElementById('video-file-input').value = '';
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
                new Date(enrollment.enrolledAt).toLocaleDateString('ko-KR'),
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
});

// 윈도우 리사이즈 이벤트
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('open');
    }
});