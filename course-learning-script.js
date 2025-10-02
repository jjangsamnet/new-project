// 학습 페이지 JavaScript

class CourseLearningSystem {
    constructor() {
        this.currentUser = null;
        this.currentCourse = null;
        this.currentLessonIndex = 0;
        this.lessons = [];
        this.progress = {};
        this.notes = {};
        this.isFirebaseReady = false;

        this.initializeWithFirebase();
    }

    async initializeWithFirebase() {
        console.log('🚀 학습 페이지 초기화 시작...');

        // Firebase 서비스 준비 대기 - 더 긴 시간 대기
        console.log('⏳ Firebase 서비스 준비 대기 중...');

        // Firebase 초기화 완료 대기 (최대 10초)
        let firebaseReady = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!firebaseReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;

            if (typeof firebaseService !== 'undefined' && typeof isFirebaseEnabled !== 'undefined') {
                if (isFirebaseEnabled && typeof auth !== 'undefined' && typeof db !== 'undefined') {
                    firebaseReady = true;
                    this.isFirebaseReady = true;
                    console.log(`✅ Firebase 준비 완료 (${attempts}회 시도)`);
                    break;
                }
            }

            // 5초 후에도 Firebase가 준비되지 않으면 localStorage 모드로
            if (attempts === 50) {
                console.log('⚠️ Firebase 초기화 지연 중 - localStorage 모드로 시작 가능성');
            }
        }

        if (!firebaseReady) {
            console.log('💾 Firebase 준비 실패 - localStorage 모드 사용');
            this.isFirebaseReady = false;
        }

        console.log('🔥 Firebase 준비 상태:', this.isFirebaseReady ? 'Firebase 모드' : 'localStorage 모드');

        // 현재 사용자 확인
        await this.checkCurrentUser();

        // URL에서 강좌 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');

        console.log('📋 URL에서 가져온 courseId:', courseId);

        if (courseId) {
            // courseId를 그대로 전달 (숫자/문자열 모두 지원)
            await this.loadCourse(courseId);
        } else {
            // 기본적으로 JavaScript 완전정복 강좌 로드
            await this.loadCourse(1);
        }

        this.init();
    }

    async checkCurrentUser() {
        try {
            if (this.isFirebaseReady) {
                this.currentUser = await firebaseService.getCurrentUser();
            } else {
                this.currentUser = JSON.parse(localStorage.getItem('lms_current_user'));
            }

            if (!this.currentUser) {
                alert('로그인이 필요합니다.');
                window.location.href = 'lms.html';
                return;
            }

            // 사용자 정보 표시
            document.getElementById('user-name-display').textContent = this.currentUser.name;
        } catch (error) {
            console.error('사용자 확인 오류:', error);
            window.location.href = 'lms.html';
        }
    }

    async loadCourse(courseId) {
        try {
            console.log('🔍 강좌 로딩 시작, courseId:', courseId, '타입:', typeof courseId);

            // LMS 시스템과 동일한 방식으로 강좌 데이터 로드
            let courses = [];
            if (this.isFirebaseReady) {
                console.log('📡 Firebase에서 강좌 데이터 로드');
                const result = await firebaseService.getCourses({ limit: 100 });
                // 페이지네이션 결과 처리
                courses = result.courses || result || [];
                console.log('Firebase 반환 타입:', typeof result, '배열 여부:', Array.isArray(result));
                console.log('result.courses 존재:', !!result.courses);
            } else {
                console.log('💾 로컬 스토리지에서 강좌 데이터 로드');
                // 로컬 스토리지에서 강좌 데이터 로드 또는 기본 데이터 사용
                const localCourses = localStorage.getItem('lms_courses');
                if (localCourses) {
                    courses = JSON.parse(localCourses);
                } else {
                    courses = this.getDefaultCourses();
                }
            }

            console.log('📚 로드된 강좌 수:', courses ? courses.length : 'undefined');
            console.log('courses 배열 여부:', Array.isArray(courses));
            console.log('강좌 ID 목록:', courses.map(c => ({id: c.id, type: typeof c.id, title: c.title})));

            // 해당 courseId의 강좌 찾기 (타입 변환 고려)
            this.currentCourse = courses.find(course => {
                const match = course.id == courseId; // == 사용하여 타입 자동 변환
                console.log(`비교: course.id(${course.id}, ${typeof course.id}) == courseId(${courseId}, ${typeof courseId}) => ${match}`);
                return match;
            });

            console.log('찾은 강좌:', this.currentCourse ? this.currentCourse.title : 'null');

            if (!this.currentCourse) {
                console.error('❌ 강좌를 찾을 수 없음');
                console.error('찾으려는 courseId:', courseId, typeof courseId);
                console.error('사용 가능한 강좌 ID:', courses.map(c => `${c.id}(${typeof c.id})`));
                alert(`강좌를 찾을 수 없습니다.\n\n강좌 ID: ${courseId}\n사용 가능한 강좌: ${courses.length}개`);
                window.location.href = 'lms.html';
                return;
            }

            // 강좌의 lessons 배열 사용 (없으면 커리큘럼에서 생성)
            if (this.currentCourse.lessons && this.currentCourse.lessons.length > 0) {
                console.log('✅ 강좌에 등록된 차시 사용:', this.currentCourse.lessons.length, '개');
                this.lessons = this.currentCourse.lessons;

                // 각 차시의 videoUrl 확인
                console.log('📹 차시별 영상 URL 확인:');
                this.lessons.forEach((lesson, index) => {
                    console.log(`  차시 ${index + 1}: ${lesson.title}`);
                    console.log(`    - video.url: ${lesson.video?.url || '없음'}`);
                    console.log(`    - video.type: ${lesson.video?.type || '없음'}`);
                });
            } else {
                console.log('⚠️ 강좌에 차시 없음 - 커리큘럼에서 생성');
                this.lessons = this.generateLessonsFromCurriculum(this.currentCourse);
            }

            // 프로그레스 및 사용자 노트 로드
            await this.loadUserProgress();

            console.log(`강좌 "${this.currentCourse.title}" 로드 완료`);
        } catch (error) {
            console.error('강좌 로드 오류:', error);
            alert('강좌를 로드하는 중 오류가 발생했습니다.');
            window.location.href = 'lms.html';
        }
    }

    generateLessonsFromCurriculum(course) {
        // 기본적으로 강좌별 맞춤 차시 생성
        if (course.id === 1) { // JavaScript 완전정복
            return [
                {
                    id: 1,
                    title: "JavaScript 소개 및 개발환경 설정",
                    description: "JavaScript가 무엇인지 알아보고, 개발환경을 설정해봅시다.",
                    duration: "15:30",
                    videoUrl: null, // 실제 비디오 URL이 들어갈 자리
                    notes: `
                        <h4>1. JavaScript란?</h4>
                        <p>• 웹 페이지에 동적 기능을 추가하는 프로그래밍 언어</p>
                        <p>• 클라이언트 사이드와 서버 사이드 모두에서 사용 가능</p>
                        <p>• 인터프리터 언어로 컴파일 과정이 필요 없음</p>

                        <h4>2. 개발환경 설정</h4>
                        <p>• 브라우저: Chrome, Firefox, Safari 등</p>
                        <p>• 에디터: VS Code, Sublime Text, Atom 등</p>
                        <p>• Node.js: 서버 사이드 JavaScript 실행 환경</p>

                        <h4>3. 첫 번째 JavaScript 코드</h4>
                        <pre><code>console.log("Hello, JavaScript!");</code></pre>
                    `
                },
                {
                    id: 2,
                    title: "변수와 데이터 타입",
                    description: "JavaScript의 변수 선언 방법과 다양한 데이터 타입을 학습합니다.",
                    duration: "22:45",
                    videoUrl: null,
                    notes: `
                        <h4>1. 변수 선언</h4>
                        <p>• var: 함수 스코프, 호이스팅 발생</p>
                        <p>• let: 블록 스코프, 재할당 가능</p>
                        <p>• const: 블록 스코프, 재할당 불가능</p>

                        <h4>2. 데이터 타입</h4>
                        <p><strong>원시 타입:</strong></p>
                        <p>• Number: 숫자</p>
                        <p>• String: 문자열</p>
                        <p>• Boolean: true/false</p>
                        <p>• undefined: 정의되지 않음</p>
                        <p>• null: 빈 값</p>
                        <p>• Symbol: 고유한 식별자</p>

                        <p><strong>참조 타입:</strong></p>
                        <p>• Object: 객체</p>
                        <p>• Array: 배열</p>
                        <p>• Function: 함수</p>
                    `
                },
                {
                    id: 3,
                    title: "연산자와 조건문",
                    description: "JavaScript의 다양한 연산자와 조건문 사용법을 배웁니다.",
                    duration: "18:20",
                    videoUrl: null,
                    notes: `
                        <h4>1. 연산자</h4>
                        <p><strong>산술 연산자:</strong> +, -, *, /, %, **</p>
                        <p><strong>비교 연산자:</strong> ==, ===, !=, !==, <, >, <=, >=</p>
                        <p><strong>논리 연산자:</strong> &&, ||, !</p>
                        <p><strong>할당 연산자:</strong> =, +=, -=, *=, /=</p>

                        <h4>2. 조건문</h4>
                        <p><strong>if문:</strong></p>
                        <pre><code>if (condition) {
    // 실행할 코드
} else if (condition2) {
    // 실행할 코드
} else {
    // 실행할 코드
}</code></pre>

                        <p><strong>switch문:</strong></p>
                        <pre><code>switch (value) {
    case 1:
        break;
    case 2:
        break;
    default:
        break;
}</code></pre>
                    `
                },
                {
                    id: 4,
                    title: "반복문과 함수",
                    description: "for, while 반복문과 함수 선언 및 사용법을 학습합니다.",
                    duration: "25:10",
                    videoUrl: null,
                    notes: `
                        <h4>1. 반복문</h4>
                        <p><strong>for문:</strong></p>
                        <pre><code>for (let i = 0; i < 10; i++) {
    console.log(i);
}</code></pre>

                        <p><strong>while문:</strong></p>
                        <pre><code>while (condition) {
    // 실행할 코드
}</code></pre>

                        <p><strong>for...of / for...in:</strong></p>
                        <pre><code>for (const item of array) {
    console.log(item);
}

for (const key in object) {
    console.log(key, object[key]);
}</code></pre>

                        <h4>2. 함수</h4>
                        <p><strong>함수 선언:</strong></p>
                        <pre><code>function functionName(param1, param2) {
    return param1 + param2;
}</code></pre>

                        <p><strong>화살표 함수:</strong></p>
                        <pre><code>const add = (a, b) => a + b;</code></pre>
                    `
                },
                {
                    id: 5,
                    title: "DOM 조작 기초",
                    description: "HTML 요소를 JavaScript로 조작하는 방법을 학습합니다.",
                    duration: "30:15",
                    videoUrl: null,
                    notes: `
                        <h4>1. DOM이란?</h4>
                        <p>• Document Object Model</p>
                        <p>• HTML 문서의 구조를 객체로 표현</p>
                        <p>• JavaScript로 HTML 요소를 조작 가능</p>

                        <h4>2. 요소 선택</h4>
                        <pre><code>// ID로 선택
const element = document.getElementById('myId');

// 클래스로 선택
const elements = document.getElementsByClassName('myClass');

// CSS 선택자로 선택
const element = document.querySelector('.myClass');
const elements = document.querySelectorAll('.myClass');</code></pre>

                        <h4>3. 요소 조작</h4>
                        <pre><code>// 내용 변경
element.textContent = '새로운 텍스트';
element.innerHTML = '<strong>HTML 내용</strong>';

// 스타일 변경
element.style.color = 'red';
element.style.backgroundColor = 'blue';

// 클래스 조작
element.classList.add('new-class');
element.classList.remove('old-class');
element.classList.toggle('toggle-class');</code></pre>
                    `
                }
            ];
        } else if (course.id === 2) { // React 마스터클래스
            return [
                {
                    id: 1,
                    title: "React 기본 개념",
                    description: "React의 핵심 개념과 컴포넌트 기반 아키텍처를 학습합니다.",
                    duration: "18:20",
                    videoUrl: null,
                    notes: `
                        <h4>1. React란?</h4>
                        <p>• 사용자 인터페이스를 만들기 위한 JavaScript 라이브러리</p>
                        <p>• 컴포넌트 기반 아키텍처</p>
                        <p>• Virtual DOM을 통한 효율적인 렌더링</p>
                    `
                },
                {
                    id: 2,
                    title: "컴포넌트와 Props",
                    description: "React 컴포넌트의 정의와 Props를 통한 데이터 전달을 학습합니다.",
                    duration: "25:15",
                    videoUrl: null,
                    notes: `
                        <h4>1. 컴포넌트</h4>
                        <p>• 함수형 컴포넌트</p>
                        <p>• 클래스형 컴포넌트</p>
                        <pre><code>function Welcome(props) {
  return &lt;h1&gt;Hello, {props.name}!&lt;/h1&gt;;
}</code></pre>
                    `
                }
            ];
        } else if (course.id === 3) { // UI/UX 디자인 기초
            return [
                {
                    id: 1,
                    title: "디자인 사고 프로세스",
                    description: "사용자 중심의 디자인 사고 방법론을 학습합니다.",
                    duration: "20:30",
                    videoUrl: null,
                    notes: `
                        <h4>1. 디자인 사고란?</h4>
                        <p>• 공감(Empathize)</p>
                        <p>• 정의(Define)</p>
                        <p>• 아이디어(Ideate)</p>
                        <p>• 프로토타입(Prototype)</p>
                        <p>• 테스트(Test)</p>
                    `
                }
            ];
        } else {
            // 기본 강좌에 대한 일반적인 차시 생성
            return course.curriculum?.map((topic, index) => ({
                id: index + 1,
                title: topic,
                description: `${topic}에 대해 학습합니다.`,
                duration: "20:00",
                videoUrl: null,
                notes: `
                    <h4>${topic}</h4>
                    <p>이 차시에서는 ${topic}에 대해 자세히 알아봅니다.</p>
                `
            })) || [];
        }
    }

    async loadUserProgress() {
        try {
            const progressKey = `course_progress_${this.currentCourse.id}_${this.currentUser.id}`;

            if (this.isFirebaseReady) {
                // Firebase에서 진행률 로드 (구현 예정)
                this.progress = JSON.parse(localStorage.getItem(progressKey)) || {};
            } else {
                this.progress = JSON.parse(localStorage.getItem(progressKey)) || {};
            }

            // 메모 로드
            const notesKey = `course_notes_${this.currentCourse.id}_${this.currentUser.id}`;
            this.notes = JSON.parse(localStorage.getItem(notesKey)) || {};

        } catch (error) {
            console.error('진행률 로드 오류:', error);
            this.progress = {};
            this.notes = {};
        }
    }

    async saveProgress() {
        try {
            const progressKey = `course_progress_${this.currentCourse.id}_${this.currentUser.id}`;
            localStorage.setItem(progressKey, JSON.stringify(this.progress));

            // 전체 진도율 계산
            const completedLessons = Object.values(this.progress).filter(p => p.completed).length;
            const totalLessons = this.lessons.length;
            const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            console.log(`📊 진도율 업데이트: ${completedLessons}/${totalLessons} = ${overallProgress}%`);

            // Firebase enrollment에 진도율 업데이트
            if (this.isFirebaseReady && typeof firebaseService !== 'undefined') {
                try {
                    const enrollments = await firebaseService.getEnrollments();
                    const enrollment = enrollments.find(e =>
                        e.userId === this.currentUser.id &&
                        e.courseId === this.currentCourse.id
                    );

                    if (enrollment) {
                        enrollment.progress = overallProgress;
                        enrollment.lastAccessedAt = new Date().toISOString();
                        const result = await firebaseService.saveEnrollment(enrollment);
                        console.log('✅ Firebase enrollment 진도율 업데이트:', overallProgress, '%');
                    }
                } catch (error) {
                    console.error('Firebase 진도율 업데이트 오류:', error);
                }
            }
        } catch (error) {
            console.error('진행률 저장 오류:', error);
        }
    }

    init() {
        this.updateCourseInfo();
        this.renderLessonsList();
        this.updateOverallProgress();
        this.bindEvents();

        // 첫 번째 강의 자동 선택
        if (this.lessons.length > 0) {
            this.selectLesson(0);
        }
    }

    updateCourseInfo() {
        // 헤더의 강좌 정보 업데이트
        const courseTitleElement = document.querySelector('.course-title h1');
        const instructorElement = document.querySelector('.course-title .instructor');

        if (courseTitleElement && this.currentCourse) {
            courseTitleElement.textContent = this.currentCourse.title;
        }

        if (instructorElement && this.currentCourse) {
            instructorElement.textContent = `강사: ${this.currentCourse.instructor}`;
        }
    }

    bindEvents() {
        // 비디오 이벤트
        const video = document.getElementById('lesson-video');
        if (video) {
            video.addEventListener('timeupdate', () => this.updateVideoProgress());
            video.addEventListener('ended', () => this.onVideoEnded());
            video.addEventListener('loadedmetadata', () => this.updateVideoTime());
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case ' ': // 스페이스바: 재생/일시정지
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft': // 왼쪽 화살표: 10초 뒤로
                    e.preventDefault();
                    this.seekVideo(-10);
                    break;
                case 'ArrowRight': // 오른쪽 화살표: 10초 앞으로
                    e.preventDefault();
                    this.seekVideo(10);
                    break;
                case 'ArrowUp': // 위쪽 화살표: 이전 강의
                    e.preventDefault();
                    this.previousLesson();
                    break;
                case 'ArrowDown': // 아래쪽 화살표: 다음 강의
                    e.preventDefault();
                    this.nextLesson();
                    break;
            }
        });
    }

    renderLessonsList() {
        const lessonsList = document.getElementById('lessons-list');

        lessonsList.innerHTML = this.lessons.map((lesson, index) => {
            const isCompleted = this.progress[lesson.id]?.completed || false;
            const isActive = index === this.currentLessonIndex;

            return `
                <div class="lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                     onclick="learningSystem.selectLesson(${index})">
                    <div class="lesson-number">${index + 1}강</div>
                    <div class="lesson-title">${lesson.title}</div>
                    <div class="lesson-duration">${lesson.duration}</div>
                </div>
            `;
        }).join('');
    }

    selectLesson(index) {
        if (index < 0 || index >= this.lessons.length) return;

        this.currentLessonIndex = index;
        const lesson = this.lessons[index];

        // UI 업데이트
        this.renderLessonsList();
        this.updateCurrentLessonInfo(lesson);
        this.loadLessonContent(lesson);
        this.updateCompletionButton();
    }

    updateCurrentLessonInfo(lesson) {
        document.getElementById('current-lesson-title').textContent = lesson.title;
        document.getElementById('lesson-description').textContent = lesson.description;

        // 강의 노트 업데이트
        document.getElementById('notes-content').innerHTML = lesson.notes;

        // 저장된 메모 로드
        const noteTextarea = document.getElementById('my-notes-textarea');
        noteTextarea.value = this.notes[lesson.id] || '';
    }

    loadLessonContent(lesson) {
        const videoPlayer = document.getElementById('video-player');
        const videoPlaceholder = document.getElementById('video-placeholder');
        const lessonVideo = document.getElementById('lesson-video');
        const videoUrl = lesson.video?.url;
        const videoType = lesson.video?.type;

        console.log('🎬 영상 로드 시도:', videoUrl, '타입:', videoType);

        if (videoUrl) {
            // 유튜브 URL인 경우 iframe으로 변환
            if (videoType === 'url' && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
                const videoId = this.extractYoutubeId(videoUrl);
                if (videoId) {
                    console.log('✅ 유튜브 영상 ID:', videoId);
                    const iframe = document.createElement('iframe');
                    iframe.id = 'youtube-player';
                    iframe.width = '100%';
                    iframe.height = '100%';
                    // 유튜브 파라미터: 제목 숨김, 관련 영상 완전 차단, 컨트롤 최소화
                    iframe.src = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1`;
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    iframe.style.position = 'absolute';
                    iframe.style.top = '0';
                    iframe.style.left = '0';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';

                    // 기존 video 요소 숨기고 iframe 추가
                    lessonVideo.style.display = 'none';
                    videoPlaceholder.innerHTML = '';
                    videoPlaceholder.style.position = 'relative';
                    videoPlaceholder.style.paddingBottom = '56.25%'; // 16:9 비율
                    videoPlaceholder.style.height = '0';
                    videoPlaceholder.style.width = '100%'; // flex 컨테이너 내에서 너비 보장
                    videoPlaceholder.style.flex = '1'; // flex 아이템으로 공간 차지
                    videoPlaceholder.appendChild(iframe);
                    videoPlaceholder.style.display = 'block';
                } else {
                    console.error('❌ 유튜브 ID 추출 실패:', videoUrl);
                    videoPlaceholder.style.display = 'flex';
                    lessonVideo.style.display = 'none';
                }
            } else {
                // 일반 비디오 파일
                lessonVideo.src = videoUrl;
                videoPlaceholder.style.display = 'none';
                lessonVideo.style.display = 'block';
            }
        } else {
            // 비디오가 없는 경우 플레이스홀더 표시
            console.log('⚠️ 영상 URL 없음');
            videoPlaceholder.style.display = 'flex';
            lessonVideo.style.display = 'none';
        }

        // 진행률 복원
        const progress = this.progress[lesson.id];
        if (progress && progress.currentTime) {
            lessonVideo.currentTime = progress.currentTime;
        }
    }

    extractYoutubeId(url) {
        // 유튜브 URL에서 비디오 ID 추출
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([^&]+)/,
            /(?:youtu\.be\/)([^?]+)/,
            /(?:youtube\.com\/embed\/)([^?]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    startLesson() {
        const lesson = this.lessons[this.currentLessonIndex];
        const videoUrl = lesson.video?.url;

        if (videoUrl) {
            // 유튜브 영상은 자동 재생되므로 별도 처리 불필요
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                console.log('▶️ 유튜브 영상 준비 완료');
            } else {
                const lessonVideo = document.getElementById('lesson-video');
                lessonVideo.play();
            }
        } else {
            // 비디오가 없는 경우 안내
            alert('이 강의는 아직 비디오가 업로드되지 않았습니다.\n관리자에게 문의해주세요.');
        }
    }

    simulateLessonProgress() {
        // 데모용: 강의 진행 시뮬레이션
        const lesson = this.lessons[this.currentLessonIndex];

        // 진행률을 100%로 설정
        this.progress[lesson.id] = {
            completed: true,
            currentTime: 0,
            totalTime: this.parseDuration(lesson.duration),
            completedAt: new Date().toISOString()
        };

        this.saveProgress();
        this.renderLessonsList();
        this.updateOverallProgress();

        // 완료 모달 표시
        this.showCompletionModal(lesson.title);
    }

    parseDuration(duration) {
        const parts = duration.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    updateVideoProgress() {
        const video = document.getElementById('lesson-video');
        const lesson = this.lessons[this.currentLessonIndex];

        if (video && lesson) {
            // 진행률 업데이트
            const progressPercent = (video.currentTime / video.duration) * 100;
            document.getElementById('lesson-progress-fill').style.width = progressPercent + '%';

            // 시간 표시 업데이트
            const currentTime = this.formatTime(video.currentTime);
            const totalTime = this.formatTime(video.duration);
            document.getElementById('lesson-time').textContent = `${currentTime} / ${totalTime}`;

            // 진행률 저장 (5초마다)
            if (Math.floor(video.currentTime) % 5 === 0) {
                this.progress[lesson.id] = {
                    ...this.progress[lesson.id],
                    currentTime: video.currentTime,
                    totalTime: video.duration,
                    lastWatched: new Date().toISOString()
                };
                this.saveProgress();
            }
        }
    }

    updateVideoTime() {
        const video = document.getElementById('lesson-video');
        if (video && video.duration) {
            const totalTime = this.formatTime(video.duration);
            document.getElementById('lesson-time').textContent = `00:00 / ${totalTime}`;
        }
    }

    onVideoEnded() {
        const lesson = this.lessons[this.currentLessonIndex];

        // 강의 완료 처리
        this.progress[lesson.id] = {
            ...this.progress[lesson.id],
            completed: true,
            completedAt: new Date().toISOString()
        };

        this.saveProgress();
        this.renderLessonsList();
        this.updateOverallProgress();

        // 완료 모달 표시
        this.showCompletionModal(lesson.title);
    }

    showCompletionModal(lessonTitle) {
        document.getElementById('completed-lesson-title').textContent = lessonTitle;
        document.getElementById('completion-modal').style.display = 'block';
    }

    closeCompletionModal() {
        document.getElementById('completion-modal').style.display = 'none';
    }

    updateOverallProgress() {
        const completedLessons = this.lessons.filter(lesson =>
            this.progress[lesson.id]?.completed
        ).length;

        const progressPercent = Math.round((completedLessons / this.lessons.length) * 100);

        document.getElementById('overall-progress').textContent = progressPercent + '%';
        document.getElementById('overall-progress-bar').style.width = progressPercent + '%';
    }

    // 컨트롤 함수들
    togglePlayPause() {
        const video = document.getElementById('lesson-video');
        const playPauseBtn = document.getElementById('play-pause-btn');

        if (video.style.display === 'none') {
            this.startLesson();
            return;
        }

        if (video.paused) {
            video.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            video.pause();
            playPauseBtn.textContent = '▶️';
        }
    }

    seekVideo(seconds) {
        const video = document.getElementById('lesson-video');
        if (video && video.style.display !== 'none') {
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        }
    }

    previousLesson() {
        if (this.currentLessonIndex > 0) {
            this.selectLesson(this.currentLessonIndex - 1);
        }
    }

    nextLesson() {
        if (this.currentLessonIndex < this.lessons.length - 1) {
            this.selectLesson(this.currentLessonIndex + 1);
        }
    }

    changePlaybackSpeed() {
        const video = document.getElementById('lesson-video');
        const speed = document.getElementById('playback-speed').value;
        if (video) {
            video.playbackRate = parseFloat(speed);
        }
    }

    // 탭 관리
    showTab(tabName) {
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // 선택된 탭 활성화
        document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`${tabName}-panel`).classList.add('active');
    }

    // 메모 저장
    saveNotes() {
        const lesson = this.lessons[this.currentLessonIndex];
        const noteText = document.getElementById('my-notes-textarea').value;

        this.notes[lesson.id] = noteText;

        // 로컬 스토리지에 저장
        const notesKey = `course_notes_${this.currentCourse.id}_${this.currentUser.id}`;
        localStorage.setItem(notesKey, JSON.stringify(this.notes));

        alert('메모가 저장되었습니다.');
    }

    // UI 토글 함수들
    toggleSidebar() {
        const sidebar = document.getElementById('lessons-sidebar');
        sidebar.classList.toggle('collapsed');
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        settingsPanel.classList.toggle('open');
    }

    changeLessonSpeed() {
        const speedSelect = document.getElementById('lesson-speed');
        const video = document.getElementById('lesson-video');
        const youtubePlayer = document.getElementById('youtube-player');

        if (speedSelect) {
            const speed = parseFloat(speedSelect.value);

            // 일반 비디오 요소
            if (video && video.style.display !== 'none') {
                video.playbackRate = speed;
                console.log(`재생 속도 변경: ${speed}x`);
            }

            // 유튜브 iframe (YouTube IFrame API 필요)
            if (youtubePlayer) {
                // 유튜브는 iframe API를 통해 배속 조절해야 함
                console.log('⚠️ 유튜브 영상은 플레이어 내 설정에서 배속을 조절해주세요.');
                alert('유튜브 영상은 플레이어 하단의 설정(⚙️)에서 배속을 조절할 수 있습니다.');
            }
        }
    }

    markLessonComplete() {
        if (!this.lessons[this.currentLessonIndex]) {
            alert('선택된 강의가 없습니다.');
            return;
        }

        const currentLesson = this.lessons[this.currentLessonIndex];
        const lessonId = currentLesson.id;

        // 이미 완료된 강의인지 확인
        if (this.progress[lessonId]?.completed) {
            alert('이미 완료된 강의입니다.');
            return;
        }

        // 진행률을 100%로 설정하고 완료 처리
        this.progress[lessonId] = {
            completed: true,
            watchTime: currentLesson.duration || '00:00',
            completedAt: new Date().toISOString(),
            progress: 100
        };

        // 버튼 상태 업데이트
        this.updateCompletionButton();

        // 사이드바 강의 목록 업데이트
        this.renderLessonsList();

        // 전체 진행률 업데이트
        this.updateOverallProgress();

        // 진행률 저장
        this.saveProgress();

        // 완료 메시지
        this.showCompletionMessage(currentLesson.title);

        console.log(`강의 "${currentLesson.title}" 완료 처리됨`);
    }

    updateCompletionButton() {
        const completeBtn = document.getElementById('mark-complete-btn');
        const currentLesson = this.lessons[this.currentLessonIndex];

        if (!completeBtn || !currentLesson) return;

        const isCompleted = this.progress[currentLesson.id]?.completed || false;

        if (isCompleted) {
            completeBtn.classList.add('completed');
            completeBtn.disabled = true;
            completeBtn.innerHTML = `
                <span class="btn-icon">✓</span>
                <span class="btn-text">수강 완료</span>
            `;
        } else {
            completeBtn.classList.remove('completed');
            completeBtn.disabled = false;
            completeBtn.innerHTML = `
                <span class="btn-icon">✓</span>
                <span class="btn-text">수강 완료</span>
            `;
        }
    }

    showCompletionMessage(lessonTitle) {
        // 간단한 완료 메시지 표시
        const message = document.createElement('div');
        message.className = 'completion-message';
        message.innerHTML = `
            <div class="message-content">
                <div class="message-icon">🎉</div>
                <div class="message-text">
                    <strong>"${lessonTitle}"</strong><br>
                    강의를 완료했습니다!
                </div>
            </div>
        `;

        document.body.appendChild(message);

        // 3초 후 메시지 제거
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    // 유틸리티 함수들
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                    "디자인 사고 프로세스",
                    "사용자 조사 및 페르소나",
                    "와이어프레임 및 프로토타입",
                    "UI 디자인 원칙",
                    "사용성 테스트"
                ]
            }
        ];
    }
}

// 전역 함수들
function goBack() {
    window.history.back();
}

function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('lms_current_user');
        window.location.href = 'lms.html';
    }
}

function startLesson() {
    learningSystem.startLesson();
}

function togglePlayPause() {
    learningSystem.togglePlayPause();
}

function previousLesson() {
    learningSystem.previousLesson();
}

function nextLesson() {
    learningSystem.nextLesson();
}

function changePlaybackSpeed() {
    learningSystem.changePlaybackSpeed();
}

function showTab(tabName) {
    learningSystem.showTab(tabName);
}

function saveNotes() {
    learningSystem.saveNotes();
}

function closeCompletionModal() {
    learningSystem.closeCompletionModal();
}

function toggleSidebar() {
    learningSystem.toggleSidebar();
}

function toggleSettings() {
    learningSystem.toggleSettings();
}

function changeLessonSpeed() {
    learningSystem.changeLessonSpeed();
}

function markLessonComplete() {
    learningSystem.markLessonComplete();
}

// 시스템 초기화
const learningSystem = new CourseLearningSystem();

// 페이지 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('학습 시스템이 초기화되었습니다.');
});