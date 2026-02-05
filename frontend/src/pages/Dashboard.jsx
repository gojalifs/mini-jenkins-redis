import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:4000/api';

function Dashboard() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBuilds();
  }, []);
  
  async function fetchBuilds() {
    try {
      const res = await fetch(`${API_URL}/builds`);
      const data = await res.json();
      setBuilds(data.builds || []);
    } catch (error) {
      console.error('Failed to fetch builds:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="dashboard">
      <h2>Build History</h2>
      
      {builds.length === 0 ? (
        <p>No builds yet. Push to a repository to trigger a build.</p>
      ) : (
        <table className="build-table">
          <thead>
            <tr>
              <th>Build ID</th>
              <th>Repository</th>
              <th>Commit</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {builds.map(build => (
              <tr key={build.id}>
                <td>
                  <Link to={`/builds/${build.id}`}>{build.id}</Link>
                </td>
                <td>{build.repo}</td>
                <td>{build.commit?.substring(0, 7)}</td>
                <td>
                  <span className={`status status-${build.status}`}>
                    {build.status}
                  </span>
                </td>
                <td>{new Date(build.createdAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => retryBuild(build.id)}>Retry</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
  
  async function retryBuild(id) {
    try {
      await fetch(`${API_URL}/builds/${id}/retry`, { method: 'POST' });
      fetchBuilds();
    } catch (error) {
      console.error('Failed to retry build:', error);
    }
  }
}

export default Dashboard;
