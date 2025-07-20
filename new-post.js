import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API || 'http://127.0.0.1:8000';

export default function NewPost({ theme, toggleTheme, user, logout }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    tag_names: []
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchTags();
  }, [user, router]);

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API}/tags`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const addTag = (tagName) => {
    if (tagName && !form.tag_names.includes(tagName)) {
      setForm(prev => ({
        ...prev,
        tag_names: [...prev.tag_names, tagName]
      }));
    }
  };

  const removeTag = (tagName) => {
    setForm(prev => ({
      ...prev,
      tag_names: prev.tag_names.filter(tag => tag !== tagName)
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      addTag(e.target.value.trim());
      setNewTag('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Post created successfully! Redirecting...');
        setTimeout(() => router.push(`/post/${data.id}`), 1500);
      } else {
        setError(data.detail || 'Failed to create post. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return form.title.trim() && form.content.trim();
  };

  const wordCount = form.content.split(/\s+/).filter(word => word.length > 0).length;

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Create New Post - CodeGenesis</title>
        <meta name="description" content="Create a new post on CodeGenesis" />
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
              <a href="/tags" className="nav-link">Tags</a>
              <a href="/new-post" className="nav-link active">New Post</a>
              <a href={`/user/${user.username}`} className="nav-link">Profile</a>
              <button onClick={logout} className="btn btn-secondary btn-sm">
                Logout
              </button>
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
            <h1>Create New Post</h1>
            <p className="text-secondary">
              Share your knowledge, ideas, and stories with the community
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

          {/* Form */}
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter your post title..."
                  value={form.title}
                  onChange={handleChange}
                  className="form-input"
                  style={{ fontSize: '1.2rem', fontWeight: '600' }}
                  required
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label">
                  Content
                  <span className="text-muted" style={{ marginLeft: '0.5rem', fontWeight: 'normal' }}>
                    ({wordCount} words)
                  </span>
                </label>
                <textarea
                  name="content"
                  placeholder="Write your post content here... You can use markdown formatting for rich text."
                  value={form.content}
                  onChange={handleChange}
                  className="form-textarea"
                  style={{ 
                    minHeight: '300px', 
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}
                  required
                />
                <small className="text-muted">
                  💡 Tip: Use **bold**, *italic*, `code`, and [links](url) for formatting
                </small>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags</label>
                
                {/* Selected Tags */}
                {form.tag_names.length > 0 && (
                  <div className="flex flex-wrap gap-sm mb-md">
                    {form.tag_names.map(tag => (
                      <span
                        key={tag}
                        className="badge badge-primary"
                        style={{ cursor: 'pointer' }}
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag Input */}
                <div className="flex gap-sm mb-md">
                  <input
                    type="text"
                    placeholder="Add a tag and press Enter..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleTagInput}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim()) {
                        addTag(newTag.trim());
                        setNewTag('');
                      }
                    }}
                    className="btn btn-secondary"
                  >
                    Add
                  </button>
                </div>

                {/* Available Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <small className="text-muted mb-sm">Popular tags:</small>
                    <div className="flex flex-wrap gap-sm">
                      {availableTags.slice(0, 10).map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => addTag(tag.name)}
                          className="badge badge-secondary"
                          style={{ 
                            backgroundColor: form.tag_names.includes(tag.name) ? tag.color : undefined,
                            color: form.tag_names.includes(tag.name) ? 'white' : undefined,
                            cursor: 'pointer'
                          }}
                          disabled={form.tag_names.includes(tag.name)}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-lg" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={!isFormValid() || loading}
                >
                  {loading ? (
                    <>
                      <div className="loading"></div>
                      Publishing...
                    </>
                  ) : (
                    'Publish Post'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Writing Tips */}
          <div className="card mt-lg" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3>💡 Writing Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <h4>Structure</h4>
                <ul className="text-sm text-secondary">
                  <li>Start with a compelling title</li>
                  <li>Use clear headings and paragraphs</li>
                  <li>Include examples and code snippets</li>
                  <li>End with a call to action</li>
                </ul>
              </div>
              <div>
                <h4>Engagement</h4>
                <ul className="text-sm text-secondary">
                  <li>Ask questions to encourage discussion</li>
                  <li>Use relevant tags for discoverability</li>
                  <li>Share your personal experiences</li>
                  <li>Include images or diagrams when helpful</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 