'use client';

import { motion } from 'framer-motion';
import styles from './Schedule.module.css';

const events = [
    { time: '09:00', event: '1교시 - 국어' },
    { time: '10:00', event: '2교시 - 수학' },
    { time: '11:00', event: '3교시 - 영어' },
    { time: '13:00', event: '점심시간 및 휴식' },
    { time: '14:00', event: '동아리 활동' },
];

export default function Schedule() {
    return (
        <section id="schedule" className={styles.section}>
            <h2 className={styles.sectionTitle}>오늘의 <span className="premium-gradient">시간표</span></h2>
            <div className={styles.timeline}>
                {events.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className={styles.row}
                    >
                        <span className={styles.time}>{item.time}</span>
                        <div className={styles.dot} />
                        <span className={styles.event}>{item.event}</span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
