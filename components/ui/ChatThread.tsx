import ChatMessage from './ChatMessage';

const messages = [
  { message: 'Hi! I’m your lifestyle assistant 👋', sender: 'assistant' },
  { message: 'Book me a cab to Churchgate', sender: 'user' },
  { message: 'Cab booked to Churchgate 🚕 ETA 3 mins.', sender: 'assistant' },
];

export default function ChatThread() {
  return (
    <div className="flex flex-col gap-3 h-[400px] overflow-y-auto bg-white p-4 rounded border">
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} message={msg.message} sender={msg.sender as 'user' | 'assistant'} />
      ))}
    </div>
  );
}
