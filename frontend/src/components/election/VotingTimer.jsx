import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VotingTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes = 180 seconds
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the interval timer
    const interval = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          // Timer has reached 0
          clearInterval(interval);
          alert('Voting session expired');
          navigate('/dashboard');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000); // Update every second

    // Cleanup function: clear the interval on component unmount
    return () => clearInterval(interval);
  }, [navigate]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Determine color based on time remaining
  const getTimerColor = () => {
    if (timeRemaining <= 30) return '#d32f2f'; // Red for critical
    if (timeRemaining <= 60) return '#f57c00'; // Orange for warning
    return '#388e3c'; // Green for normal
  };

  return (
    <div className="voting-timer" style={{
      padding: '16px',
      backgroundColor: getTimerColor(),
      color: 'white',
      borderRadius: '8px',
      textAlign: 'center',
      marginBottom: '20px',
      fontWeight: 'bold',
      fontSize: '18px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <p style={{ margin: '0' }}>⏱️ Time Remaining: {formatTime(timeRemaining)}</p>
    </div>
  );
};

export default VotingTimer;
