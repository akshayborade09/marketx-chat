type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
};

export default function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center px-4 py-2 rounded font-semibold transition';

  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-600',
    secondary: 'bg-surface text-dark border border-gray-300 hover:bg-gray-100',
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}
