type ChatMessageProps = {
  message: string;
  sender: 'user' | 'assistant';
};

export default function ChatMessage({ message, sender }: ChatMessageProps) {
  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg text-sm whitespace-pre-line ${
          isUser
            ? 'bg-gray-900 text-white rounded-br-none'
            : 'bg-gray-100 text-dark rounded-bl-none'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
