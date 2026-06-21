import { useState } from 'react'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import styles from './PasswordField.module.css'

export default function PasswordField({ value, onChange, placeholder = 'Enter password' }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.wrapper}>
      <FiLock size={16} className={styles.lockIcon} />
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
      <button
        type="button"
        className={styles.toggleBtn}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  )
}