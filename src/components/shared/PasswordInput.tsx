import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { DS } from '@/lib/design-system'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * PasswordInput — giống Input.tsx nhưng có nút mắt bật/tắt hiển thị mật khẩu.
 * 
 * Tại sao không dùng Input.tsx với rightIcon?
 * → rightIcon trong Input.tsx có pointer-events-none (không click được).
 * → Cần button thật để toggle type, nên tách thành component riêng cho rõ ràng.
 * 
 * Dùng khi: password field trong Login, Register, ChangePassword, AI key.
 */
export const PasswordInput = ({
    label,
    error,
    helperText,
    id,
    className = '',
    ...props
}: PasswordInputProps) => {
    // State bật/tắt hiển thị text
    const [show, setShow] = useState(false)

    // Tự sinh id nếu không truyền vào — cần để label htmlFor hoạt động
    const inputId = id ?? `pw-input-${Math.random().toString(36).slice(2, 9)}`

    return (
        <div className="flex flex-col gap-1.5">

            {/* Label */}
            {label && (
                <label htmlFor={inputId} className={DS.label}>
                    {label}
                    {props.required && (
                        <span className="text-danger-500 ml-0.5" aria-hidden="true">*</span>
                    )}
                </label>
            )}

            {/* Wrapper relative để định vị nút mắt */}
            <div className="relative">
                <input
                    id={inputId}
                    // Toggle giữa password và text
                    type={show ? 'text' : 'password'}
                    className={[
                        DS.inputBase,
                        'pr-10',   // padding phải để text không bị nút che
                        error ? 'border-danger-500 focus:ring-danger-500' : '',
                        className,
                    ].join(' ')}
                    aria-invalid={!!error}
                    aria-describedby={
                        error ? `${inputId}-error` :
                            helperText ? `${inputId}-helper` :
                                undefined
                    }
                    {...props}
                />

                {/* Nút mắt — tabIndex=-1 để Tab không dừng lại ở đây */}
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    tabIndex={-1}
                    className="
                        absolute right-3 top-1/2 -translate-y-1/2
                        text-text-muted hover:text-text-primary
                        transition-colors duration-150
                        focus:outline-none
                    "
                    aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>

            {/* Thông báo lỗi */}
            {error && (
                <p
                    id={`${inputId}-error`}
                    className="text-xs text-danger-500 flex items-center gap-1"
                    role="alert"
                >
                    <span aria-hidden="true">⚠</span>
                    {error}
                </p>
            )}

            {/* Helper text — chỉ hiện khi không có lỗi */}
            {helperText && !error && (
                <p id={`${inputId}-helper`} className={DS.muted}>
                    {helperText}
                </p>
            )}

        </div>
    )
}