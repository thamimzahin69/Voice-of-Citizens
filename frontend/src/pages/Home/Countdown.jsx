import { useEffect, useState } from 'react';

const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 10);

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(() => targetDate - new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(targetDate - new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="countdown" className="countdown">
      <h2>Next Election Launches In</h2>
      <div className="countdown-timer">{formatTime(timeLeft)}</div>
    </section>
  );
}
