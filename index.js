import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API || 'http://127.0.0.1:8000';

export default function Home({ theme, toggleTheme, user, login, logout }) {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, selectedTag]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${API}/posts`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API}/tags`);
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(post =>
        post.tags.some(tag => tag.name === selectedTag)
      );
    }

    setFilteredPosts(filtered);
  };

  const handleLike = async (postId, isLiked) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const method = isLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API}/posts/${postId}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Update the post in the list
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked_by_user: !isLiked,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Head>
        <title>CodeGenesis - Modern Blog Platform</title>
        <meta name="description" content="A modern blog platform built with Next.js and FastAPI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="/" className="logo">
              🚀 CodeGenesis
            </a>
            
            <nav className="nav">
              <a href="/" className="nav-link active">Home</a>
              <a href="/tags" className="nav-link">Tags</a>
              <a href="/prompt-to-app" className="nav-link">Prompt-to-App</a>
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
        {/* Hero Section */}
        <section className="text-center mb-xl">
          <h1 className="fade-in">Welcome to CodeGenesis</h1>
          <p className="text-lg text-secondary mb-lg">
            A modern platform for sharing knowledge, ideas, and stories
          </p>
          
          {/* Search Bar */}
          <div className="flex justify-center mb-lg">
            <div style={{ maxWidth: '500px', width: '100%' }}>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ fontSize: '1.1rem', padding: '1rem 1.5rem' }}
              />
            </div>
          </div>

          {/* Tag Filter */}
          <div className="flex justify-center flex-wrap gap-sm">
            <button
              onClick={() => setSelectedTag('')}
              className={`badge ${selectedTag === '' ? 'badge-primary' : 'badge-secondary'}`}
            >
              All Posts
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag === tag.name ? '' : tag.name)}
                className={`badge ${selectedTag === tag.name ? 'badge-primary' : 'badge-secondary'}`}
                style={{ backgroundColor: selectedTag === tag.name ? tag.color : undefined }}
              >
                {tag.name} ({tag.posts_count})
              </button>
            ))}
          </div>
        </section>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: '200px', marginBottom: '1rem' }}></div>
                <div className="skeleton" style={{ height: '24px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton" style={{ height: '16px', marginBottom: '1rem' }}></div>
                <div className="skeleton" style={{ height: '60px' }}></div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-xl">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <h3>No posts found</h3>
            <p className="text-secondary">
              {searchTerm || selectedTag 
                ? 'Try adjusting your search or filter criteria'
                : 'Be the first to create a post!'
              }
            </p>
            {user && (
              <a href="/new-post" className="btn btn-primary btn-lg mt-lg">
                Create Your First Post
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {filteredPosts.map(post => (
              <article key={post.id} className="card slide-up">
                <div className="card-header">
                  <h3 className="card-title">
                    <a href={`/post/${post.id}`} className="text-primary">
                      {post.title}
                    </a>
                  </h3>
                  <div className="card-subtitle">
                    By {post.author.full_name || post.author.username} • {formatDate(post.created_at)}
                  </div>
                </div>
                
                <div className="card-content">
                  <p>{truncateText(post.content)}</p>
                </div>

                <div className="card-footer">
                  <div className="flex items-center gap-sm">
                    <button
                      onClick={() => handleLike(post.id, post.is_liked_by_user)}
                      className={`btn btn-sm ${post.is_liked_by_user ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ minWidth: 'auto', padding: '0.5rem' }}
                    >
                      {post.is_liked_by_user ? '❤️' : '🤍'} {post.likes_count}
                    </button>
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

        {/* Call to Action */}
        {user && filteredPosts.length > 0 && (
          <section className="text-center mt-xl">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3>Share Your Knowledge</h3>
              <p className="text-secondary mb-lg">
                Have something interesting to share? Create a new post and join the conversation!
              </p>
              <a href="/new-post" className="btn btn-primary btn-lg">
                Create New Post
              </a>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-color)', 
        padding: '2rem 0',
        marginTop: '4rem',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div className="container">
          <div className="text-center">
            <p className="text-secondary">
              © 2024 CodeGenesis. Built with ❤️ using Next.js and FastAPI.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
} 