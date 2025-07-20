import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API || 'http://127.0.0.1:8000';

export default function Tags({ theme, toggleTheme, user, logout }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', description: '', color: '#3B82F6' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API}/tags`);
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTag)
      });

      const data = await response.json();

      if (response.ok) {
        setTags(prev => [data, ...prev]);
        setNewTag({ name: '', description: '', color: '#3B82F6' });
        setShowCreateForm(false);
        setSuccess('Tag created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to create tag');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagClick = (tagName) => {
    router.push(`/?tag=${encodeURIComponent(tagName)}`);
  };

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: 'var(--text-secondary)'
      }}>
        <div className="loading"></div>
        <span style={{ marginLeft: '1rem' }}>Loading tags...</span>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tags - CodeGenesis</title>
        <meta name="description" content="Browse and manage tags on CodeGenesis" />
      </Head>

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="/" className="logo">
              🚀 CodeGenesis
            </a>
            
            <nav className="nav">
              <a href="/" className="nav-link">Home</a>
              <a href="/tags" className="nav-link active">Tags</a>
              {user ? (
                <>
                  <a href="/new-post" className="nav-link">New Post</a>
                  <a href={`/user/${user.username}`} className="nav-link">Profile</a>
                  <button onClick={logout} className="btn btn-secondary btn-sm">
                    Logout
                  </button>
                </>
              ) : (
                <a href="/auth" className="btn btn-primary btn-sm">Login</a>
              )}
              <button 
                onClick={toggleTheme} 
                className="btn btn-secondary btn-sm"
                style={{ minWidth: '40px', padding: '0.5rem' }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="fade-in">
          {/* Page Header */}
          <div className="text-center mb-xl">
            <h1>Tags</h1>
            <p className="text-secondary">
              Discover topics and organize content with tags
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error mb-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success mb-lg">
              {success}
            </div>
          )}

          {/* Create Tag Section */}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <div className="card mb-xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="flex justify-between items-center mb-lg">
                <h3>Create New Tag</h3>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="btn btn-secondary btn-sm"
                >
                  {showCreateForm ? 'Cancel' : 'Create Tag'}
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={handleCreateTag}>
                  <div className="form-group">
                    <label className="form-label">Tag Name</label>
                    <input
                      type="text"
                      placeholder="Enter tag name..."
                      value={newTag.name}
                      onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      placeholder="Enter tag description..."
                      value={newTag.description}
                      onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                      className="form-textarea"
                      style={{ minHeight: '80px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <div className="flex gap-sm mb-sm">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewTag(prev => ({ ...prev, color }))}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: newTag.color === color ? '3px solid var(--border-color)' : 'none',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={newTag.color}
                      onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                      className="form-input"
                      style={{ width: '100px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!newTag.name.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="loading"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Tag'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Tags Grid */}
          {tags.length === 0 ? (
            <div className="text-center py-xl">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏷️</div>
              <h3>No tags found</h3>
              <p className="text-secondary">
                {user && (user.role === 'admin' || user.role === 'moderator')
                  ? 'Create the first tag to get started!'
                  : 'Tags will appear here once they are created.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {tags.map(tag => (
                <div 
                  key={tag.id} 
                  className="card slide-up"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTagClick(tag.name)}
                >
                  <div className="card-header">
                    <div className="flex items-center gap-sm mb-sm">
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: tag.color
                        }}
                      />
                      <h3 className="card-title" style={{ margin: 0 }}>
                        #{tag.name}
                      </h3>
                    </div>
                    {tag.description && (
                      <p className="card-subtitle" style={{ margin: 0 }}>
                        {tag.description}
                      </p>
                    )}
                  </div>

                  <div className="card-content">
                    <div className="flex items-center gap-md">
                      <span className="text-sm text-secondary">
                        📝 {tag.posts_count} posts
                      </span>
                      <span className="text-sm text-secondary">
                        📅 {new Date(tag.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagClick(tag.name);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      View Posts
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statistics */}
          {tags.length > 0 && (
            <div className="card mt-xl" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 className="text-center mb-lg">Tag Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {tags.length}
                  </div>
                  <div className="text-sm text-secondary">Total Tags</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {tags.reduce((sum, tag) => sum + tag.posts_count, 0)}
                  </div>
                  <div className="text-sm text-secondary">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {tags.length > 0 ? Math.round(tags.reduce((sum, tag) => sum + tag.posts_count, 0) / tags.length) : 0}
                  </div>
                  <div className="text-sm text-secondary">Avg Posts/Tag</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 