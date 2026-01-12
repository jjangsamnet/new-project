'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ClipboardList, Image, Calendar } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={styles.navbar}
    >
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className="premium-gradient">우리반 홈페이지</span>
        </Link>
        <div className={styles.links}>
          <Link href="#notice" className={styles.link}><ClipboardList size={20} /> 공지사항</Link>
          <Link href="#gallery" className={styles.link}><Image size={20} /> 갤러리</Link>
          <Link href="#schedule" className={styles.link}><Calendar size={20} /> 일정</Link>
        </div>
      </div>
    </motion.nav>
  );
}
