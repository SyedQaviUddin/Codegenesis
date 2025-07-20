import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API || 'http://127.0.0.1:8000';

export default function PostDetail({ theme, toggleTheme, user, login, logout }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ content: '', parent_id: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${API}/posts/${id}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPost(data);
      } else {
        setError('Post not found');
      }
    } catch (error) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API}/posts/${id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const method = post.is_liked_by_user ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API}/posts/${id}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setPost(prev => ({
          ...prev,
          is_liked_by_user: !prev.is_liked_by_user,
          likes_count: prev.is_liked_by_user ? prev.likes_count - 1 : prev.likes_count + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
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
      const response = await fetch(`${API}/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(commentForm)
      });

      const data = await response.json();

      if (response.ok) {
        setComments(prev => [data, ...prev]);
        setCommentForm({ content: '', parent_id: null });
        setSuccess('Comment added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.detail || 'Failed to add comment');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

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
        <span style={{ marginLeft: '1rem' }}>Loading post...</span>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
          <h2>Post Not Found</h2>
          <p className="text-secondary mb-lg">{error}</p>
          <a href="/" className="btn btn-primary">Go Home</a>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <>
      <Head>
        <title>{post.title} - CodeGenesis</title>
        <meta name="description" content={post.content.substring(0, 160)} />
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
          {/* Breadcrumb */}
          <nav className="mb-lg">
            <a href="/" className="text-secondary">← Back to Posts</a>
          </nav>

          {/* Post Content */}
          <article className="card mb-xl">
            {/* Post Header */}
            <div className="card-header">
              <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {post.title}
              </h1>
              
              <div className="flex items-center gap-md mb-md">
                <div className="flex items-center gap-sm">
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {(post.author.full_name || post.author.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {post.author.full_name || post.author.username}
                    </div>
                    <div className="text-sm text-secondary">
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-sm mb-md">
                  {post.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="badge badge-secondary"
                      style={{ backgroundColor: tag.color, color: 'white' }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="card-content">
              <div style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap'
              }}>
                {post.content}
              </div>
            </div>

            {/* Post Footer */}
            <div className="card-footer">
              <div className="flex items-center gap-md">
                <button
                  onClick={handleLike}
                  className={`btn ${post.is_liked_by_user ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {post.is_liked_by_user ? '❤️' : '🤍'} {post.likes_count} Likes
                </button>
                
                <span className="text-secondary">
                  💬 {post.comments_count} Comments
                </span>
                
                <span className="text-secondary">
                  👁️ {post.view_count} Views
                </span>
              </div>

              <div className="text-sm text-secondary">
                {post.updated_at && post.updated_at !== post.created_at && (
                  <span>Updated {formatRelativeTime(post.updated_at)}</span>
                )}
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <section className="card">
            <h3 className="mb-lg">Comments ({comments.length})</h3>

            {/* Add Comment */}
            {user ? (
              <div className="mb-lg">
                <form onSubmit={handleCommentSubmit}>
                  <div className="form-group">
                    <textarea
                      placeholder="Share your thoughts..."
                      value={commentForm.content}
                      onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                      className="form-textarea"
                      style={{ minHeight: '100px' }}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="alert alert-error mb-md">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="alert alert-success mb-md">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!commentForm.content.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="loading"></div>
                        Posting...
                      </>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="alert alert-info mb-lg">
                <a href="/auth" className="text-info">Sign in</a> to leave a comment.
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-md">
              {comments.length === 0 ? (
                <div className="text-center py-lg">
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💭</div>
                  <p className="text-secondary">No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="p-md" style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    <div className="flex items-start gap-sm mb-sm">
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {(comment.author.full_name || comment.author.username).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold">
                          {comment.author.full_name || comment.author.username}
                        </div>
                        <div className="text-sm text-secondary">
                          {formatRelativeTime(comment.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {comment.content}
                    </div>
                    
                    {comment.replies_count > 0 && (
                      <div className="text-sm text-secondary mt-sm">
                        {comment.replies_count} replies
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
} 