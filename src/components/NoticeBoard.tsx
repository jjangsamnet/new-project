'use client';

import { motion } from 'framer-motion';
import styles from './NoticeBoard.module.css';

const notices = [
    { id: 1, tag: '공지', title: '금요일 현장체험학습 안내', date: '2026.01.15' },
    { id: 2, tag: '활동', title: '학급 자치회 회의 결과 소식', date: '2026.01.12' },
    { id: 3, tag: '과제', title: '수학 익힘책 50-55쪽 풀어오기', date: '2026.01.10' },
];

export default function NoticeBoard() {
    return (
        <section id="notice" className={styles.section}>
            <h2 className={styles.sectionTitle}>학급 <span className="premium-gradient">공지사항</span></h2>
            <div className={styles.list}>
                {notices.map((notice, index) => (
                    <motion.div
                        key={notice.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className={styles.card}
                    >
                        <span className={styles.tag}>{notice.tag}</span>
                        <h3 className={styles.title}>{notice.title}</h3>
                        <span className={styles.date}>{notice.date}</span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
