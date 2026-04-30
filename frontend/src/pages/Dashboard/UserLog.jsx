const logs = [
  { user: 'Amina Rahman', action: 'User signed in', timestamp: '2026-04-30 09:22', ip: '192.168.1.24', status: 'Success' },
  { user: 'Karim Ahmed', action: 'User submitted registration', timestamp: '2026-04-30 10:05', ip: '192.168.1.25', status: 'Pending' },
  { user: 'Admin', action: 'Admin approved registration', timestamp: '2026-04-30 10:18', ip: '192.168.1.10', status: 'Success' },
  { user: 'Nusrat Jahan', action: 'User joined election', timestamp: '2026-04-30 11:01', ip: '192.168.1.28', status: 'Success' },
  { user: 'Rafi Islam', action: 'User submitted complaint', timestamp: '2026-04-30 11:42', ip: '192.168.1.31', status: 'In Review' },
];

function badgeClass(status) {
  if (status === 'Success') return 'badge-approved';
  if (status === 'Pending') return 'badge-pending';
  return 'badge-review';
}

export default function UserLog() {
  return (
    <section className="page">
      <header className="page-header">
        <p className="page-eyebrow">System activity</p>
        <h1>User Log</h1>
        <p>Monitor user actions, timestamps, IP addresses, and system status.</p>
      </header>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Timestamp</th>
                <th>IP address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={`${log.user}-${log.timestamp}`}>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.timestamp}</td>
                  <td>{log.ip}</td>
                  <td><span className={`badge ${badgeClass(log.status)}`}>{log.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
