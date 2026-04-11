import { useRef } from 'react';
import html2canvas from 'html2canvas';

const VoterBadge = ({ electionName = 'Voice of Citizens' }) => {
  const badgeRef = useRef(null);

  const handleDownloadBadge = async () => {
    try {
      if (!badgeRef.current) return;

      // Capture the badge with high resolution and transparent background
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        backgroundColor: null, // Transparent background
        logging: false,
      });

      // Convert canvas to PNG data URL
      const pngDataUrl = canvas.toDataURL('image/png');

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = pngDataUrl;
      
      // Format filename: replace spaces with underscores
      const fileName = `${electionName.replace(/\s+/g, '_')}_Badge.png`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading badge:', error);
      alert('Failed to download badge. Please try again.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      padding: '30px',
      backgroundColor: '#f5f5f5',
      borderRadius: '12px',
      maxWidth: '400px',
      margin: '20px auto',
    }}>
      {/* I Voted Badge */}
      <div
        ref={badgeRef}
        style={{
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          padding: '20px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
        }}>
          I VOTED
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          marginTop: '15px',
          opacity: 0.95,
          maxWidth: '90%',
          wordWrap: 'break-word',
        }}>
          {electionName}
        </div>
        <div style={{
          marginTop: '15px',
          fontSize: '32px',
        }}>
          ✓
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownloadBadge}
        style={{
          padding: '12px 28px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          margin: '10px 0',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#764ba2';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#667eea';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        }}
      >
        📥 Download My Badge
      </button>

      <p style={{
        fontSize: '12px',
        color: '#666',
        margin: '0',
        textAlign: 'center',
      }}>
        Share your voting accomplishment on social media!
      </p>
    </div>
  );
};

export default VoterBadge;
