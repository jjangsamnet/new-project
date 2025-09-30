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
            const checkFirebase = () => {
                if (typeof isFirebaseEnabled !== 'undefined') {
                    this.isFirebaseReady = isFirebaseEnabled;
                    resolve(this.isFirebaseReady);
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

            // Firestore에 사용자 정보 저장
            await db.collection(this.collections.users).doc(user.uid).set({
                id: user.uid,
                email: email,
                name: userData.name,
                phone: userData.phone,
                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                user: {
                    id: user.uid,
                    email: email,
                    name: userData.name,
                    phone: userData.phone
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

    // 강좌 데이터 관리
    async getCourses() {
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

    // 수강신청 관리
    async getEnrollments() {
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
            await db.collection(this.collections.enrollments).add({
                ...enrollmentData,
                enrolledAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('수강신청 저장 오류:', error);
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
        if (!this.isFirebaseReady) {
            return this.fallbackToLocal('saveSettings', arguments);
        }

        try {
            await db.collection(this.collections.settings).doc('main').set({
                ...settingsData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('설정 저장 오류:', error);
            return { success: false, error: error.message };
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
            case 'signIn':
                return this.localSignIn(args[0], args[1]);
            case 'signUp':
                return this.localSignUp(args[0], args[1], args[2]);
            case 'signOut':
                localStorage.removeItem('lms_current_user');
                return { success: true };
            default:
                return { success: false, error: '지원되지 않는 로컬 작업입니다.' };
        }
    }

    localSignIn(email, password) {
        const users = JSON.parse(localStorage.getItem('lms_users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('lms_current_user', JSON.stringify(user));
            return { success: true, user: user };
        } else {
            return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }
    }

    localSignUp(email, password, userData) {
        const users = JSON.parse(localStorage.getItem('lms_users')) || [];
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
            return { success: false, error: '이미 존재하는 이메일입니다.' };
        }

        const newUser = {
            id: Date.now(),
            email: email,
            name: userData.name,
            phone: userData.phone,
            registeredAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('lms_users', JSON.stringify(users));

        return { success: true, user: newUser };
    }
}

// 전역 Firebase 서비스 인스턴스
const firebaseService = new FirebaseService();

// Firebase 준비 완료 대기
document.addEventListener('DOMContentLoaded', async () => {
    await firebaseService.waitForFirebase();
    console.log('Firebase 서비스 준비 완료:', firebaseService.isFirebaseReady ? 'Firebase 모드' : '로컬 모드');
});