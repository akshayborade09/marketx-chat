type CardProps = {
  children: React.ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <div className="rounded-lg bg-surface shadow-md p-4 border border-gray-200">
      {children}
    </div>
  );
}
