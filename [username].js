import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API || 'http://127.0.0.1:8000';

export default function UserProfile({ theme, toggleTheme, user: currentUser, login, logout }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const router = useRouter();
  const { username } = router.query;

  useEffect(() => {
    if (username) {
      fetchUser();
      fetchUserPosts();
    }
  }, [username]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API}/users/${username}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setError('User not found');
      }
    } catch (error) {
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${API}/posts?author=${username}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    if (currentUser.username === username) {
      return;
    }

    setFollowLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = isFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API}/users/${username}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setUser(prev => ({
          ...prev,
          followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
        <span style={{ marginLeft: '1rem' }}>Loading profile...</span>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
          <h2>User Not Found</h2>
          <p className="text-secondary mb-lg">{error}</p>
          <a href="/" className="btn btn-primary">Go Home</a>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>{user.full_name || user.username} - CodeGenesis</title>
        <meta name="description" content={`Profile of ${user.full_name || user.username} on CodeGenesis`} />
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
              {currentUser ? (
                <>
                  <a href="/new-post" className="nav-link">New Post</a>
                  <a href={`/user/${currentUser.username}`} className="nav-link">Profile</a>
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
          {/* User Profile Header */}
          <div className="card mb-xl">
            <div className="flex items-start gap-lg">
              {/* Avatar */}
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '3rem',
                flexShrink: 0
              }}>
                {(user.full_name || user.username).charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-md mb-md">
                  <h1 style={{ margin: 0 }}>{user.full_name || user.username}</h1>
                  {user.is_verified && (
                    <span className="badge badge-success">✓ Verified</span>
                  )}
                  {user.role !== 'user' && (
                    <span className="badge badge-warning">{user.role}</span>
                  )}
                </div>

                <p className="text-secondary mb-md">
                  @{user.username}
                </p>

                {user.bio && (
                  <p className="mb-md">{user.bio}</p>
                )}

                <div className="flex items-center gap-lg mb-md">
                  <div className="text-center">
                    <div className="text-xl font-bold">{user.posts_count}</div>
                    <div className="text-sm text-secondary">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{user.followers_count}</div>
                    <div className="text-sm text-secondary">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{user.following_count}</div>
                    <div className="text-sm text-secondary">Following</div>
                  </div>
                </div>

                <div className="text-sm text-secondary mb-md">
                  Member since {formatDate(user.created_at)}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-md">
                  {currentUser && currentUser.username !== username ? (
                    <button
                      onClick={handleFollow}
                      className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <>
                          <div className="loading"></div>
                          {isFollowing ? 'Unfollowing...' : 'Following...'}
                        </>
                      ) : (
                        isFollowing ? 'Unfollow' : 'Follow'
                      )}
                    </button>
                  ) : currentUser && currentUser.username === username ? (
                    <button
                      onClick={() => router.push('/settings')}
                      className="btn btn-secondary"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <a href="/auth" className="btn btn-primary">
                      Follow
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Posts */}
          <section>
            <h2 className="mb-lg">Posts by {user.full_name || user.username}</h2>
            
            {posts.length === 0 ? (
              <div className="text-center py-xl">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                <h3>No posts yet</h3>
                <p className="text-secondary">
                  {currentUser && currentUser.username === username
                    ? 'Start sharing your knowledge by creating your first post!'
                    : 'This user hasn\'t published any posts yet.'
                  }
                </p>
                {currentUser && currentUser.username === username && (
                  <a href="/new-post" className="btn btn-primary btn-lg mt-lg">
                    Create Your First Post
                  </a>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {posts.map(post => (
                  <article key={post.id} className="card slide-up">
                    <div className="card-header">
                      <h3 className="card-title">
                        <a href={`/post/${post.id}`} className="text-primary">
                          {post.title}
                        </a>
                      </h3>
                      <div className="card-subtitle">
                        {formatDate(post.created_at)}
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <p>{truncateText(post.content)}</p>
                    </div>

                    <div className="card-footer">
                      <div className="flex items-center gap-sm">
                        <span className="text-sm text-secondary">
                          ❤️ {post.likes_count}
                        </span>
                        <span className="text-sm text-secondary">
                          💬 {post.comments_count}
                        </span>
                        <span className="text-sm text-secondary">
                          👁️ {post.view_count}
                        </span>
                      </div>
                      
                      <div className="flex gap-xs">
                        {post.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag.id}
                            className="badge badge-secondary"
                            style={{ backgroundColor: tag.color, color: 'white' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {post.tags.length > 2 && (
                          <span className="badge badge-secondary">
                            +{post.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
} 