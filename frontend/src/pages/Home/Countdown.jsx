import { useEffect, useState } from 'react';

const targetDate = new Date('2027-01-15T09:00:00+06:00');

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
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
    <section id="countdown" className="section section-muted">
      <div className="countdown-card card">
        <div className="page-header">
          <p className="page-eyebrow">Next Major Election</p>
          <h1>National General Election</h1>
          <p>
            Date: 15 January 2027. Citizens can review candidates, join the
            election, and cast their vote during the official voting window.
          </p>
        </div>
        <div className="countdown-grid">
          {Object.entries(formatTime(timeLeft)).map(([label, value]) => (
            <div className="countdown-unit" key={label}>
              <strong>{String(value).padStart(2, '0')}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
