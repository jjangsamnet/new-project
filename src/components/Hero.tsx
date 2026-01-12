'use client';

import { motion } from 'framer-motion';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className={styles.content}
            >
                <h1 className={styles.title}>
                    우리의 <span className="premium-gradient">꿈</span>과 <span className="premium-gradient">추억</span>이<br />
                    자라나는 공간
                </h1>
                <p className={styles.subtitle}>
                    함께 성장하고 소통하는 즐거운 우리 반입니다.
                </p>
                <div className={styles.actions}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={styles.primaryBtn}
                    >
                        시작하기
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={styles.secondaryBtn}
                    >
                        소개 보기
                    </motion.button>
                </div>
            </motion.div>
            <div className={styles.backgroundGlow} />
        </section>
    );
}
