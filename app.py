from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from typing import List, Optional
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- Configuration ---
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATABASE_URL = "sqlite:///./codegenesis.db"

# --- Rate Limiting ---
limiter = Limiter(key_func=get_remote_address)

# --- Database Setup ---
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- JWT Config ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/token")

# OAuth2 scheme for optional authentication
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="users/token", auto_error=False)

# --- FastAPI App ---
app = FastAPI(title="CodeGenesis API", version="2.0.0")

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# --- Database Models ---

# Association tables for many-to-many relationships
post_tags = Table(
    'post_tags', Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

user_follows = Table(
    'user_follows', Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id')),
    Column('following_id', Integer, ForeignKey('users.id'))
)

post_likes = Table(
    'post_likes', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('post_id', Integer, ForeignKey('posts.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String, default="user")  # admin, moderator, user
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    posts = relationship("Post", back_populates="author")
    comments = relationship("Comment", back_populates="author")
    followers = relationship(
        "User", secondary=user_follows,
        primaryjoin=(user_follows.c.following_id == id),
        secondaryjoin=(user_follows.c.follower_id == id),
        backref="following"
    )
    liked_posts = relationship("Post", secondary=post_likes, back_populates="liked_by")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"))
    is_published = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")
    liked_by = relationship("User", secondary=post_likes, back_populates="liked_posts")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    author = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    replies = relationship("Comment", backref="parent", remote_side=[id])

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    color = Column(String, default="#3B82F6")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    posts = relationship("Post", secondary=post_tags, back_populates="tags")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)  # like, comment, follow, mention
    title = Column(String)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    related_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    related_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Create tables
Base.metadata.create_all(bind=engine)

# --- Pydantic Models ---

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0

    class Config:
        from_attributes = True

class PostBase(BaseModel):
    title: str
    content: str
    is_published: bool = True

class PostCreate(PostBase):
    tag_names: List[str] = []

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None
    tag_names: Optional[List[str]] = None

class PostResponse(PostBase):
    id: int
    author_id: int
    author: UserResponse
    is_featured: bool
    view_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    tags: List["TagResponse"] = []
    comments_count: int = 0
    likes_count: int = 0
    is_liked_by_user: bool = False

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    parent_id: Optional[int] = None

class CommentResponse(CommentBase):
    id: int
    author_id: int
    author: UserResponse
    post_id: int
    parent_id: Optional[int]
    created_at: datetime
    replies_count: int = 0

    class Config:
        from_attributes = True

class TagBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: int
    created_at: datetime
    posts_count: int = 0

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Database Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Authentication Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_optional_user(token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except jwt.PyJWTError:
        return None
    user = db.query(User).filter(User.username == username).first()
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# --- API Endpoints ---

@app.post("/users/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name or user.username,
        bio=user.bio,
        avatar_url=user.avatar_url
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return user without password
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        bio=db_user.bio,
        avatar_url=db_user.avatar_url,
        is_active=db_user.is_active,
        is_verified=db_user.is_verified,
        role=db_user.role,
        created_at=db_user.created_at
    )

@app.post("/users/token", response_model=Token)
@limiter.limit("10/minute")
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            bio=user.bio,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_verified=user.is_verified,
            role=user.role,
            created_at=user.created_at
        )
    )

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    followers_count = len(current_user.followers)
    following_count = len(current_user.following)
    posts_count = len(current_user.posts)
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        role=current_user.role,
        created_at=current_user.created_at,
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count
    )

@app.put("/users/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        role=current_user.role,
        created_at=current_user.created_at
    )

@app.get("/users/{username}", response_model=UserResponse)
async def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    followers_count = len(user.followers)
    following_count = len(user.following)
    posts_count = len(user.posts)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        role=user.role,
        created_at=user.created_at,
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count
    )

@app.post("/users/{username}/follow")
async def follow_user(
    username: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    user_to_follow = db.query(User).filter(User.username == username).first()
    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_follow in current_user.following:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    current_user.following.append(user_to_follow)
    db.commit()
    
    return {"message": f"Successfully followed {username}"}

@app.delete("/users/{username}/follow")
async def unfollow_user(
    username: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_to_unfollow = db.query(User).filter(User.username == username).first()
    if not user_to_unfollow:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_unfollow not in current_user.following:
        raise HTTPException(status_code=400, detail="Not following this user")
    
    current_user.following.remove(user_to_unfollow)
    db.commit()
    
    return {"message": f"Successfully unfollowed {username}"}

@app.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_post = Post(
        title=post.title,
        content=post.content,
        author_id=current_user.id,
        is_published=post.is_published
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    # Handle tags
    for tag_name in post.tag_names:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        db_post.tags.append(tag)
    
    db.commit()
    db.refresh(db_post)
    
    return PostResponse(
        id=db_post.id,
        title=db_post.title,
        content=db_post.content,
        author_id=db_post.author_id,
        author=UserResponse(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            full_name=current_user.full_name,
            bio=current_user.bio,
            avatar_url=current_user.avatar_url,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            role=current_user.role,
            created_at=current_user.created_at
        ),
        is_published=db_post.is_published,
        is_featured=db_post.is_featured,
        view_count=db_post.view_count,
        created_at=db_post.created_at,
        updated_at=db_post.updated_at,
        tags=[TagResponse(
            id=tag.id,
            name=tag.name,
            description=tag.description,
            color=tag.color,
            created_at=tag.created_at
        ) for tag in db_post.tags]
    )

@app.get("/posts", response_model=List[PostResponse])
async def get_posts(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    author: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.is_published == True)
    
    if search:
        query = query.filter(Post.title.contains(search) | Post.content.contains(search))
    
    if tag:
        query = query.join(Post.tags).filter(Tag.name == tag)
    
    if author:
        query = query.join(Post.author).filter(User.username == author)
    
    posts = query.offset(skip).limit(limit).all()
    
    result = []
    for post in posts:
        # Increment view count
        post.view_count += 1
        
        # Check if current user liked this post
        is_liked = False
        if current_user:
            is_liked = post in current_user.liked_posts
        
        result.append(PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            author_id=post.author_id,
            author=UserResponse(
                id=post.author.id,
                username=post.author.username,
                email=post.author.email,
                full_name=post.author.full_name,
                bio=post.author.bio,
                avatar_url=post.author.avatar_url,
                is_active=post.author.is_active,
                is_verified=post.author.is_verified,
                role=post.author.role,
                created_at=post.author.created_at
            ),
            is_published=post.is_published,
            is_featured=post.is_featured,
            view_count=post.view_count,
            created_at=post.created_at,
            updated_at=post.updated_at,
            tags=[TagResponse(
                id=tag.id,
                name=tag.name,
                description=tag.description,
                color=tag.color,
                created_at=tag.created_at
            ) for tag in post.tags],
            comments_count=len(post.comments),
            likes_count=len(post.liked_by),
            is_liked_by_user=is_liked
        ))
    
    db.commit()
    return result

@app.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment view count
    post.view_count += 1
    
    # Check if current user liked this post
    is_liked = False
    if current_user:
        is_liked = post in current_user.liked_posts
    
    db.commit()
    
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        author_id=post.author_id,
        author=UserResponse(
            id=post.author.id,
            username=post.author.username,
            email=post.author.email,
            full_name=post.author.full_name,
            bio=post.author.bio,
            avatar_url=post.author.avatar_url,
            is_active=post.author.is_active,
            is_verified=post.author.is_verified,
            role=post.author.role,
            created_at=post.author.created_at
        ),
        is_published=post.is_published,
        is_featured=post.is_featured,
        view_count=post.view_count,
        created_at=post.created_at,
        updated_at=post.updated_at,
        tags=[TagResponse(
            id=tag.id,
            name=tag.name,
            description=tag.description,
            color=tag.color,
            created_at=tag.created_at
        ) for tag in post.tags],
        comments_count=len(post.comments),
        likes_count=len(post.liked_by),
        is_liked_by_user=is_liked
    )

@app.post("/posts/{post_id}/like")
async def like_post(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post in current_user.liked_posts:
        raise HTTPException(status_code=400, detail="Already liked this post")
    
    current_user.liked_posts.append(post)
    db.commit()
    
    return {"message": "Post liked successfully"}

@app.delete("/posts/{post_id}/like")
async def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post not in current_user.liked_posts:
        raise HTTPException(status_code=400, detail="Post not liked")
    
    current_user.liked_posts.remove(post)
    db.commit()
    
    return {"message": "Post unliked successfully"}

@app.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_comment = Comment(
        content=comment.content,
        author_id=current_user.id,
        post_id=post_id,
        parent_id=comment.parent_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return CommentResponse(
        id=db_comment.id,
        content=db_comment.content,
        author_id=db_comment.author_id,
        author=UserResponse(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            full_name=current_user.full_name,
            bio=current_user.bio,
            avatar_url=current_user.avatar_url,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            role=current_user.role,
            created_at=current_user.created_at
        ),
        post_id=db_comment.post_id,
        parent_id=db_comment.parent_id,
        created_at=db_comment.created_at
    )

@app.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(
        Comment.post_id == post_id,
        Comment.parent_id.is_(None)
    ).all()
    
    result = []
    for comment in comments:
        replies_count = len(comment.replies)
        result.append(CommentResponse(
            id=comment.id,
            content=comment.content,
            author_id=comment.author_id,
            author=UserResponse(
                id=comment.author.id,
                username=comment.author.username,
                email=comment.author.email,
                full_name=comment.author.full_name,
                bio=comment.author.bio,
                avatar_url=comment.author.avatar_url,
                is_active=comment.author.is_active,
                is_verified=comment.author.is_verified,
                role=comment.author.role,
                created_at=comment.author.created_at
            ),
            post_id=comment.post_id,
            parent_id=comment.parent_id,
            created_at=comment.created_at,
            replies_count=replies_count
        ))
    
    return result

@app.get("/tags", response_model=List[TagResponse])
async def get_tags(db: Session = Depends(get_db)):
    try:
        tags = db.query(Tag).all()
        
        # If no tags exist, create some default ones
        if not tags:
            default_tags = [
                {"name": "Technology", "description": "Tech-related posts", "color": "#3B82F6"},
                {"name": "Programming", "description": "Programming tutorials and tips", "color": "#10B981"},
                {"name": "Design", "description": "UI/UX and design posts", "color": "#F59E0B"},
                {"name": "Tutorial", "description": "Step-by-step guides", "color": "#8B5CF6"},
                {"name": "News", "description": "Latest updates and news", "color": "#EF4444"}
            ]
            
            for tag_data in default_tags:
                db_tag = Tag(**tag_data)
                db.add(db_tag)
            
            db.commit()
            tags = db.query(Tag).all()
        
        result = []
        for tag in tags:
            posts_count = len(tag.posts)
            result.append(TagResponse(
                id=tag.id,
                name=tag.name,
                description=tag.description,
                color=tag.color,
                created_at=tag.created_at,
                posts_count=posts_count
            ))
        
        return result
    except Exception as e:
        # Return empty list if there's any error
        return []

@app.post("/tags", response_model=TagResponse)
async def create_tag(
    tag: TagCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not authorized to create tags")
    
    db_tag = Tag(
        name=tag.name,
        description=tag.description,
        color=tag.color
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    
    return TagResponse(
        id=db_tag.id,
        name=db_tag.name,
        description=db_tag.description,
        color=db_tag.color,
        created_at=db_tag.created_at
    )

@app.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return notifications

@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}

@app.get("/")
async def root():
    return {"message": "Welcome to CodeGenesis API v2.0.0", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

