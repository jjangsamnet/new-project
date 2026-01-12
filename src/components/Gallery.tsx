'use client';

import { motion } from 'framer-motion';
import styles from './Gallery.module.css';

const images = [
    { id: 1, title: '봄꽃 나들이', color: 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)' },
    { id: 2, title: '체육대회', color: 'linear-gradient(to top, #48c6ef 0%, #6f86d6 100%)' },
    { id: 3, title: '학예회 연습', color: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)' },
    { id: 4, title: '급식 시간', color: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)' },
];

export default function Gallery() {
    return (
        <section id="gallery" className={styles.section}>
            <h2 className={styles.sectionTitle}>학급 <span className="premium-gradient">갤러리</span></h2>
            <div className={styles.grid}>
                {images.map((img, index) => (
                    <motion.div
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className={styles.photoCard}
                    >
                        <div className={styles.imagePlaceholder} style={{ background: img.color }} />
                        <div className={styles.overlay}>
                            <h3>{img.title}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
