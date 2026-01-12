'use client';

import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <p>© 2026 우리반 학급홈페이지. All rights reserved.</p>
                <div className={styles.links}>
                    <span>이용약관</span>
                    <span>개인정보처리방침</span>
                </div>
            </div>
        </footer>
    );
}
