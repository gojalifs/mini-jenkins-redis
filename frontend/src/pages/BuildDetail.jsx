import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = 'http://localhost:4000/api';

function BuildDetail() {
  const { id } = useParams();
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBuild();
  }, [id]);
  
  async function fetchBuild() {
    try {
      const res = await fetch(`${API_URL}/builds/${id}`);
      const data = await res.json();
      setBuild(data.build);
    } catch (error) {
      console.error('Failed to fetch build:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <div>Loading...</div>;
  if (!build) return <div>Build not found</div>;
  
  return (
    <div className="build-detail">
      <Link to="/">← Back to Dashboard</Link>
      
      <h2>Build {build.id}</h2>
      
      <div className="build-info">
        <div className="info-row">
          <span className="label">Repository:</span>
          <span>{build.repo}</span>
        </div>
        <div className="info-row">
          <span className="label">Commit:</span>
          <span>{build.commit}</span>
        </div>
        <div className="info-row">
          <span className="label">Status:</span>
          <span className={`status status-${build.status}`}>
            {build.status}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Created:</span>
          <span>{new Date(build.createdAt).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="build-logs">
        <h3>Build Logs</h3>
        <pre>
          {/* TODO: Fetch and display logs from /logs/build-{id}.log */}
          Log viewer coming soon...
        </pre>
      </div>
    </div>
  );
}

export default BuildDetail;
