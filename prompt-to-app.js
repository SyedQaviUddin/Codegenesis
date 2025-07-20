import { useState } from 'react';
import { saveAs } from 'file-saver';

const TABS = ['Spec', 'Backend', 'Frontend'];

export default function PromptToApp() {
  const [prompt, setPrompt] = useState('Make an app for recipes with login and comments');
  const [spec, setSpec] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [codePreview, setCodePreview] = useState({ backend: '', frontend: '' });
  const [tab, setTab] = useState('Spec');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSaved(false);
    setSpec('');
    setCodePreview({ backend: '', frontend: '' });
    try {
      const res = await fetch('/api/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok) {
        setSpec(data.yaml);
        setCodePreview({
          backend: data.backend || '',
          frontend: data.frontend || ''
        });
      } else {
        setError(data.error || 'Failed to generate spec.');
      }
    } catch (e) {
      setError('Network error.');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/save-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml: spec })
      });
      if (res.ok) {
        setSaved(true);
      } else {
        setError('Failed to save spec.');
      }
    } catch (e) {
      setError('Network error.');
    }
    setLoading(false);
  };

  const handleBuild = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/build-app', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to build app.');
      const blob = await res.blob();
      saveAs(blob, 'generated-app.zip');
    } catch (e) {
      setError('Failed to build and download app.');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: 700, margin: '2rem auto', padding: 24 }}>
      <h1>Prompt-to-App: Generate Kiro Spec from AI</h1>
      <p>Describe your app in plain English. Example: <code>Make an app for recipes with login and comments</code></p>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={4}
        style={{ width: '100%', fontSize: 18, marginBottom: 16, padding: 12 }}
        placeholder="Describe your app..."
      />
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !prompt}>
          {loading ? 'Generating...' : 'Generate Spec'}
        </button>
        {spec && (
          <button className="btn btn-success" onClick={handleSave} disabled={loading}>
            Save Spec
          </button>
        )}
      </div>
      {error && <div className="alert alert-error mt-md">{error}</div>}
      {spec && (
        <div style={{ marginTop: 32 }}>
          <h3>Generated App Preview</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {TABS.map(t => (
              <button
                key={t}
                className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, fontSize: 16, overflowX: 'auto', minHeight: 200 }}>
            {tab === 'Spec' && <pre>{spec}</pre>}
            {tab === 'Backend' && <pre>{codePreview.backend || 'No backend code preview available.'}</pre>}
            {tab === 'Frontend' && <pre>{codePreview.frontend || 'No frontend code preview available.'}</pre>}
          </div>
          {saved && (
            <div className="alert alert-success mt-md">
              Spec saved to <code>.kiro/specs.yaml</code>! <br />
              <a href="/" className="btn btn-primary mt-md" style={{ marginRight: 12 }}>Go Home</a>
              <button className="btn btn-success mt-md" onClick={handleBuild} disabled={loading}>
                {loading ? 'Building...' : 'Start Building & Download App'}
              </button>
              <a href="https://vercel.com/new" target="_blank" rel="noopener" className="btn btn-dark mt-md" style={{ marginLeft: 12 }}>Deploy to Vercel</a>
              <a href="https://render.com/deploy" target="_blank" rel="noopener" className="btn btn-dark mt-md" style={{ marginLeft: 12 }}>Deploy to Render</a>
              <a href="https://github.com/new" target="_blank" rel="noopener" className="btn btn-dark mt-md" style={{ marginLeft: 12 }}>Clone to GitHub</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 