import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function ManifestoDetails() {
  const { election } = useOutletContext();
  const [manifestos, setManifestos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/elections/${election._id}/manifestos`);
        setManifestos(data);
      } finally {
        setLoading(false);
      }
    }

    if (election) load();
  }, [election]);

  return (
    <section className="subpage">
      <h2>Manifesto Details</h2>
      {loading && <p>Loading manifestos…</p>}
      {!loading && manifestos.length === 0 && <p>No manifesto information is available yet.</p>}
      <div className="grid">
        {manifestos.map((item) => (
          <article key={item._id} className="manifesto-card">
            <h3>{item.candidateName}</h3>
            <p>{item.manifesto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
