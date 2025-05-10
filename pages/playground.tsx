import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ChatThread from '../components/ui/ChatThread';


export default function Playground() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark">🎯 UI Playground</h1>

      <ChatThread />
    </div>
  );
}
