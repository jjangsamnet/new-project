// Firebase 서비스 레이어
// 데이터베이스 작업을 위한 통합 서비스

class FirebaseService {
    constructor() {
        this.isFirebaseReady = false;
        this.collections = {
            courses: 'courses',
            users: 'users',
            enrollments: 'enrollments',
            settings: 'settings'
        };
    }

    // Firebase 준비 상태 확인
    async waitForFirebase() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5초 최대 대기

            const checkFirebase = () => {
                attempts++;

                if (typeof isFirebaseEnabled !== 'undefined') {
                    this.isFirebaseReady = isFirebaseEnabled;
                    console.log(`🔥 Firebase 상태 확인 (${attempts}회 시도):`, this.isFirebaseReady ? '활성화' : '비활성화');

                    if (this.isFirebaseReady) {
                        // 추가 확인: 실제 Firebase 서비스 접근 가능한지
                        if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
                            console.log('✅ Firebase 서비스 모두 준비됨');
                            resolve(true);
                        } else {
                            console.warn('⚠️ Firebase 변수는 true이지만 서비스가 없음');
                            this.isFirebaseReady = false;
                            resolve(false);
                        }
                    } else {
                        resolve(false);
                    }
                } else if (attempts >= maxAttempts) {
                    console.warn('⏰ Firebase 상태 확인 시간 초과');
                    this.isFirebaseReady = false;
                    resolve(false);
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };

            checkFirebase();
        });
    }

    // 사용자 인증
    async signUp(email, password, userData) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('signUp', arguments);
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Firestore에 사용자 정보 저장 (비밀번호 제외 - Firebase Auth에서 관리)
            await db.collection(this.collections.users).doc(user.uid).set({
                id: user.uid,
                email: email,
                name: userData.name,
                phone: userData.phone,
                region: userData.region,
                organization: userData.organization,
                authMethod: 'firebase',
                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                user: {
                    id: user.uid,
                    email: email,
                    name: userData.name,
                    phone: userData.phone,
                    region: userData.region,
                    organization: userData.organization,
                    authMethod: 'firebase'
                }
            };
        } catch (error) {
            console.error('Firebase 회원가입 오류:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('signIn', arguments);
        }

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Firestore에서 사용자 정보 가져오기
            const userDoc = await db.collection(this.collections.users).doc(user.uid).get();

            if (userDoc.exists) {
                return {
                    success: true,
                    user: userDoc.data()
                };
            } else {
                return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
            }
        } catch (error) {
            console.error('Firebase 로그인 오류:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('signOut');
        }

        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Firebase 로그아웃 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // 모든 사용자 가져오기
    async getUsers() {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('getUsers');
        }

        try {
            const snapshot = await db.collection(this.collections.users).orderBy('registeredAt').get();
            return snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        } catch (error) {
            console.error('사용자 데이터 가져오기 오류:', error);
            return this.fallbackToLocal('getUsers');
        }
    }

    // 현재 사용자 가져오기
    getCurrentUser() {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('getCurrentUser');
        }

        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const userDoc = await db.collection(this.collections.users).doc(user.uid).get();
                    resolve(userDoc.exists ? userDoc.data() : null);
                } else {
                    resolve(null);
                }
                unsubscribe();
            });
        });
    }

    // 사용자 정보 업데이트
    async updateUser(userId, userData) {
        if (!this.isFirebaseReady) {
            console.warn('Firebase 비활성화 - localStorage 사용');
            return false;
        }

        try {
            await db.collection(this.collections.users).doc(userId).update(userData);
            console.log('✅ Firebase 사용자 정보 업데이트 성공');
            return true;
        } catch (error) {
            console.error('사용자 정보 업데이트 오류:', error);
            return false;
        }
    }

    // 강좌 데이터 관리 (페이지네이션 지원)
    async getCourses(options = {}) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('getCourses');
        }

        const {
            limit = 50,  // 기본 50개씩 로드
            startAfter = null,  // 마지막 문서 (다음 페이지용)
            orderBy = 'id',
            orderDirection = 'asc'
        } = options;

        try {
            let query = db.collection(this.collections.courses)
                .orderBy(orderBy, orderDirection)
                .limit(limit);

            // 다음 페이지 로드 시
            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            const snapshot = await query.get();

            return {
                courses: snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })),
                lastDoc: snapshot.docs[snapshot.docs.length - 1],  // 다음 페이지용
                hasMore: snapshot.docs.length === limit  // 더 있는지 여부
            };
        } catch (error) {
            console.error('강좌 데이터 가져오기 오류:', error);
            return this.fallbackToLocal('getCourses');
        }
    }

    // 모든 강좌 가져오기 (관리자용, 캐싱 권장)
    async getAllCourses() {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('getCourses');
        }

        try {
            const snapshot = await db.collection(this.collections.courses).orderBy('id').get();
            return snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        } catch (error) {
            console.error('강좌 데이터 가져오기 오류:', error);
            return this.fallbackToLocal('getCourses');
        }
    }

    async saveCourse(courseData) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('saveCourse', arguments);
        }

        try {
            if (courseData.firebaseId) {
                // 기존 강좌 업데이트
                await db.collection(this.collections.courses).doc(courseData.firebaseId).update(courseData);
            } else {
                // 새 강좌 추가
                await db.collection(this.collections.courses).add({
                    ...courseData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return { success: true };
        } catch (error) {
            console.error('강좌 저장 오류:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteCourse(courseId, firebaseId) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('deleteCourse', arguments);
        }

        try {
            if (firebaseId) {
                await db.collection(this.collections.courses).doc(firebaseId).delete();
            }
            return { success: true };
        } catch (error) {
            console.error('강좌 삭제 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // 수강신청 관리 (페이지네이션 지원)
    async getEnrollments(options = {}) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('getEnrollments');
        }

        const {
            limit = 100,  // 기본 100개씩 로드
            startAfter = null,
            userId = null  // 특정 사용자 수강신청만 조회
        } = options;

        try {
            let query = db.collection(this.collections.enrollments)
                .orderBy('enrolledAt', 'desc')
                .limit(limit);

            // 특정 사용자 필터링
            if (userId) {
                query = query.where('userId', '==', userId);
            }

            // 페이지네이션
            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            const snapshot = await query.get();

            return {
                enrollments: snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })),
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === limit
            };
        } catch (error) {
            console.error('수강신청 데이터 가져오기 오류:', error);
            return this.fallbackToLocal('getEnrollments');
        }
    }

    // 모든 수강신청 가져오기 (관리자용)
    async getAllEnrollments() {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('getEnrollments');
        }

        try {
            const snapshot = await db.collection(this.collections.enrollments).orderBy('enrolledAt', 'desc').get();
            return snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        } catch (error) {
            console.error('수강신청 데이터 가져오기 오류:', error);
            return this.fallbackToLocal('getEnrollments');
        }
    }

    async saveEnrollment(enrollmentData) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('saveEnrollment', arguments);
        }

        try {
            // Firestore Transaction을 사용하여 중복 수강신청 방지
            const result = await db.runTransaction(async (transaction) => {
                const enrollmentsRef = db.collection(this.collections.enrollments);

                // 1. 중복 체크: 같은 사용자가 같은 강좌에 이미 수강신청했는지 확인
                const duplicateQuery = await enrollmentsRef
                    .where('userId', '==', enrollmentData.userId)
                    .where('courseId', '==', enrollmentData.courseId)
                    .get();

                if (!duplicateQuery.empty) {
                    throw new Error('이미 수강신청한 강좌입니다.');
                }

                // 2. 새 수강신청 문서 생성
                const newEnrollmentRef = enrollmentsRef.doc(); // 고유 ID 생성
                transaction.set(newEnrollmentRef, {
                    ...enrollmentData,
                    id: newEnrollmentRef.id,
                    enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                return newEnrollmentRef.id;
            });

            // Transaction 성공
            return {
                success: true,
                enrollmentId: result,
                firebaseId: result
            };

        } catch (error) {
            console.error('수강신청 저장 오류:', error);

            // 중복 오류인 경우 명확한 메시지
            if (error.message.includes('이미 수강신청')) {
                return { success: false, error: error.message, isDuplicate: true };
            }

            return { success: false, error: error.message };
        }
    }

    async updateEnrollmentStatus(enrollmentId, firebaseId, status) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('updateEnrollmentStatus', arguments);
        }

        try {
            if (firebaseId) {
                await db.collection(this.collections.enrollments).doc(firebaseId).update({
                    status: status,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return { success: true };
        } catch (error) {
            console.error('수강신청 상태 업데이트 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // 설정 관리
    async getSettings() {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('getSettings');
        }

        try {
            const doc = await db.collection(this.collections.settings).doc('main').get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('설정 데이터 가져오기 오류:', error);
            return this.fallbackToLocal('getSettings');
        }
    }

    async saveSettings(settingsData) {
        console.log('🔥 firebaseService.saveSettings 호출');
        console.log('Firebase 준비 상태:', this.isFirebaseReady);
        console.log('저장할 데이터:', settingsData);

        if (!this.isFirebaseReady) {
            console.log('❌ Firebase 비활성화 - 로컬 저장으로 폴백');
            return this.fallbackToLocal('saveSettings', arguments);
        }

        try {
            console.log('📝 Firestore settings 컬렉션에 저장 시도...');

            // 컬렉션 및 문서 참조 확인
            if (!db) {
                console.error('❌ Firestore 데이터베이스 객체가 없음');
                return { success: false, error: 'Firestore database not available' };
            }

            const settingsRef = db.collection(this.collections.settings).doc('main');
            console.log('문서 경로:', `${this.collections.settings}/main`);

            const dataToSave = {
                ...settingsData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('최종 저장 데이터:', dataToSave);

            await settingsRef.set(dataToSave, { merge: true });

            console.log('✅ Firestore 설정 저장 성공');
            return { success: true };

        } catch (error) {
            console.error('❌ 설정 저장 오류:', error);
            console.error('오류 코드:', error.code);
            console.error('오류 메시지:', error.message);

            // 구체적인 오류 정보 제공
            let errorMessage = error.message;
            if (error.code === 'permission-denied') {
                errorMessage = 'Firestore 권한 오류 - 보안 규칙을 확인해주세요';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Firestore 서비스 연결 실패 - 네트워크를 확인해주세요';
            }

            return { success: false, error: errorMessage };
        }
    }

    // 파일 업로드 (Firebase Storage)
    async uploadFile(file, path) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('uploadFile', arguments);
        }

        try {
            const storageRef = storage.ref().child(path);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            return {
                success: true,
                url: downloadURL,
                path: path
            };
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // 로컬 스토리지 폴백 함수들
    fallbackToLocal(method, args) {
        console.log(`Firebase 사용 불가, 로컬 스토리지 사용: ${method}`);

        switch (method) {
            case 'getCourses':
                return JSON.parse(localStorage.getItem('lms_courses')) || [];
            case 'getEnrollments':
                return JSON.parse(localStorage.getItem('lms_enrollments')) || [];
            case 'getSettings':
                return JSON.parse(localStorage.getItem('lms_settings')) || {};
            case 'getCurrentUser':
                return JSON.parse(localStorage.getItem('lms_current_user')) || null;
            case 'getUsers':
                return JSON.parse(localStorage.getItem('lms_users')) || [];
            case 'signIn':
                return this.localSignIn(args[0], args[1]);
            case 'signUp':
                return this.localSignUp(args[0], args[1], args[2]);
            case 'signOut':
                localStorage.removeItem('lms_current_user');
                return { success: true };
            case 'saveSettings':
                console.log('💾 localStorage로 설정 저장 (Firebase 폴백)');
                const settingsData = args[0];
                localStorage.setItem('lms_settings', JSON.stringify(settingsData));
                return { success: true };
            default:
                return { success: false, error: '지원되지 않는 로컬 작업입니다.' };
        }
    }

    async localSignIn(email, password) {
        const users = JSON.parse(localStorage.getItem('lms_users')) || [];

        // 이메일로 사용자 찾기
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }

        // 비밀번호 검증
        let isPasswordValid = false;

        // cryptoUtils가 없으면 로그인 차단
        if (typeof cryptoUtils === 'undefined') {
            console.error('❌ 암호화 유틸리티가 로드되지 않았습니다.');
            return { success: false, error: '시스템 오류가 발생했습니다. 페이지를 새로고침 해주세요.' };
        }

        // 해싱된 비밀번호인지 확인 (salt$hash 형식)
        if (user.password && user.password.includes('$')) {
            // 해싱된 비밀번호 검증
            isPasswordValid = await cryptoUtils.verifyPassword(password, user.password);
        } else {
            // 평문 비밀번호는 더 이상 지원하지 않음 - 강제 마이그레이션 필요
            console.warn('⚠️ 평문 비밀번호 감지 - 마이그레이션 필요');

            // 임시로 평문 비밀번호 확인
            const plainTextMatch = (password === user.password);

            if (plainTextMatch) {
                // 즉시 해싱된 비밀번호로 마이그레이션
                console.log('🔄 평문 비밀번호를 해싱된 비밀번호로 마이그레이션 중...');
                const hashedPassword = await cryptoUtils.hashPassword(password);
                user.password = hashedPassword;

                // 업데이트된 사용자 정보 저장
                const userIndex = users.findIndex(u => u.email === email);
                users[userIndex] = user;
                localStorage.setItem('lms_users', JSON.stringify(users));
                console.log('✅ 비밀번호 마이그레이션 완료');

                isPasswordValid = true;
            } else {
                isPasswordValid = false;
            }
        }

        if (isPasswordValid) {
            // 응답에서 비밀번호 제거
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;

            localStorage.setItem('lms_current_user', JSON.stringify(userWithoutPassword));
            return { success: true, user: userWithoutPassword };
        } else {
            return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }
    }

    async localSignUp(email, password, userData) {
        const users = JSON.parse(localStorage.getItem('lms_users')) || [];
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            return { success: false, error: '이미 존재하는 이메일입니다.' };
        }

        // 비밀번호 해싱
        let hashedPassword = password;
        if (typeof cryptoUtils !== 'undefined') {
            hashedPassword = await cryptoUtils.hashPassword(password);
            console.log('🔐 비밀번호 해싱 완료');
        } else {
            console.warn('⚠️ cryptoUtils를 사용할 수 없어 평문으로 저장됩니다.');
        }

        const newUser = {
            id: Date.now(),
            email: email,
            name: userData.name,
            phone: userData.phone,
            region: userData.region,
            organization: userData.organization,
            password: hashedPassword,
            authMethod: 'localStorage',
            registeredAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('lms_users', JSON.stringify(users));

        // 응답에서 비밀번호 제거
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;

        return { success: true, user: userWithoutPassword };
    }

    // 사용자 삭제
    async deleteUser(firebaseId) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('deleteUser', arguments);
        }

        try {
            await db.collection(this.collections.users).doc(firebaseId).delete();
            console.log('✅ Firebase 사용자 삭제 성공:', firebaseId);
            return { success: true };
        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            throw error;
        }
    }

    // 수강신청 삭제
    async deleteEnrollment(firebaseId) {
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('deleteEnrollment', arguments);
        }

        try {
            await db.collection(this.collections.enrollments).doc(firebaseId).delete();
            console.log('✅ Firebase 수강신청 삭제 성공:', firebaseId);
            return { success: true };
        } catch (error) {
            console.error('수강신청 삭제 오류:', error);
            throw error;
        }
    }

    // 수강신청 진도율 업데이트
    async updateEnrollmentProgress(firebaseId, progress) {
        if (!this.isFirebaseReady) {
            console.warn('⚠️ Firebase 비활성화 - 진도율 업데이트 불가');
            return { success: false, error: 'Firebase not ready' };
        }

        try {
            const progressNum = Math.min(100, Math.max(0, parseInt(progress) || 0));

            await db.collection(this.collections.enrollments).doc(firebaseId).update({
                progress: progressNum,
                updatedAt: new Date().toISOString()
            });

            console.log('✅ Firebase 진도율 업데이트 성공:', firebaseId, progressNum + '%');
            return { success: true, progress: progressNum };
        } catch (error) {
            console.error('❌ 진도율 업데이트 오류:', error);
            throw error;
        }
    }

    // 히어로 이미지를 Firebase Storage에 업로드
    async uploadHeroImage(file) {
        if (!this.isFirebaseReady) {
            console.warn('⚠️ Firebase Storage 비활성화 - Base64 폴백 필요');
            return { success: false, error: 'Firebase Storage not available' };
        }

        try {
            console.log('📤 Firebase Storage 업로드 시작:', file.name);

            // Storage 참조 생성
            const timestamp = Date.now();
            const filename = `hero-images/${timestamp}_${file.name}`;
            const storageRef = storage.ref(filename);

            console.log('📁 업로드 경로:', filename);

            // 파일 업로드
            const uploadTask = await storageRef.put(file);
            console.log('✅ 파일 업로드 완료');

            // 다운로드 URL 가져오기
            const downloadURL = await storageRef.getDownloadURL();
            console.log('🔗 다운로드 URL:', downloadURL);

            return {
                success: true,
                url: downloadURL,
                path: filename
            };
        } catch (error) {
            console.error('❌ Firebase Storage 업로드 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 히어로 이미지 삭제 (Storage에서)
    async deleteHeroImage(imagePath) {
        if (!this.isFirebaseReady) {
            return { success: false, error: 'Firebase Storage not available' };
        }

        try {
            if (!imagePath) {
                return { success: true }; // 삭제할 이미지 없음
            }

            // URL에서 경로 추출 (필요한 경우)
            let path = imagePath;
            if (imagePath.includes('firebase')) {
                // URL인 경우 파일 경로 추출 로직 필요
                console.log('⚠️ URL에서 경로 추출 필요:', imagePath);
                // 간단한 구현: Storage URL 파싱 생략
                return { success: true };
            }

            const storageRef = storage.ref(path);
            await storageRef.delete();
            console.log('✅ Firebase Storage 이미지 삭제 성공:', path);

            return { success: true };
        } catch (error) {
            console.error('❌ Firebase Storage 이미지 삭제 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 전역 Firebase 서비스 인스턴스
const firebaseService = new FirebaseService();

// Firebase 준비 완료 대기
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase 설정 완료까지 좀 더 기다림
    setTimeout(async () => {
        console.log('🔥 firebaseService 초기화 시작...');
        await firebaseService.waitForFirebase();
        console.log(`🎯 Firebase 서비스 준비 완료: ${firebaseService.isFirebaseReady ? 'Firebase 모드' : '로컬 모드'}`);

        // 전역으로 상태 알림
        window.firebaseServiceReady = true;
        window.firebaseServiceMode = firebaseService.isFirebaseReady ? 'firebase' : 'localStorage';

        // 사용자 정의 이벤트 발생
        document.dispatchEvent(new CustomEvent('firebaseServiceReady', {
            detail: { isReady: firebaseService.isFirebaseReady }
        }));
    }, 1000); // 1초 지연으로 firebase-config.js 초기화 후 실행
});