import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ClassicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger';
  icon?: ReactNode;
};

export default function ClassicButton({
  variant = 'outline',
  icon,
  className = '',
  children,
  ...props
}: ClassicButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'border-transparent bg-[#1dbf73] text-white hover:bg-[#169b5c]'
      : variant === 'danger'
        ? 'border-[#d1d7dc] bg-white text-[#e53e3e] hover:bg-[#f9fbfb]'
        : 'border-[#2c3e50] bg-transparent text-[#2c3e50] hover:bg-[#f7f9fa]';

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 border px-4 py-2 text-[14px] font-bold transition ${variantClasses} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}
