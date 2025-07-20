#!/usr/bin/env python3
"""
Sample data script for CodeGenesis
Run this to populate the database with sample data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import get_db, User, Tag, Post, get_password_hash
from sqlalchemy.orm import Session

def create_sample_data():
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Create sample users
        users_data = [
            {
                "username": "demo",
                "email": "demo@example.com",
                "password": "demo123",
                "full_name": "Demo User",
                "bio": "A demo user for testing the platform",
                "role": "user"
            },
            {
                "username": "admin",
                "email": "admin@example.com",
                "password": "admin123",
                "full_name": "Admin User",
                "bio": "Platform administrator",
                "role": "admin",
                "is_verified": True
            },
            {
                "username": "moderator",
                "email": "mod@example.com",
                "password": "mod123",
                "full_name": "Moderator User",
                "bio": "Content moderator",
                "role": "moderator",
                "is_verified": True
            }
        ]
        
        for user_data in users_data:
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                hashed_password = get_password_hash(user_data["password"])
                user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    hashed_password=hashed_password,
                    full_name=user_data["full_name"],
                    bio=user_data["bio"],
                    role=user_data["role"],
                    is_verified=user_data.get("is_verified", False)
                )
                db.add(user)
                print(f"Created user: {user_data['username']}")
        
        db.commit()
        
        # Create sample tags
        tags_data = [
            {"name": "Technology", "description": "Tech-related posts", "color": "#3B82F6"},
            {"name": "Programming", "description": "Programming tutorials and tips", "color": "#10B981"},
            {"name": "Design", "description": "UI/UX and design posts", "color": "#F59E0B"},
            {"name": "Tutorial", "description": "Step-by-step guides", "color": "#8B5CF6"},
            {"name": "News", "description": "Latest updates and news", "color": "#EF4444"},
            {"name": "JavaScript", "description": "JavaScript related content", "color": "#F7DF1E"},
            {"name": "Python", "description": "Python programming", "color": "#3776AB"},
            {"name": "React", "description": "React.js framework", "color": "#61DAFB"}
        ]
        
        created_tags = []
        for tag_data in tags_data:
            existing_tag = db.query(Tag).filter(Tag.name == tag_data["name"]).first()
            if not existing_tag:
                tag = Tag(**tag_data)
                db.add(tag)
                created_tags.append(tag)
                print(f"Created tag: {tag_data['name']}")
        
        db.commit()
        
        # Get users and tags for creating posts
        demo_user = db.query(User).filter(User.username == "demo").first()
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        # Create sample posts
        posts_data = [
            {
                "title": "Welcome to CodeGenesis!",
                "content": """# Welcome to CodeGenesis!

This is a modern blog platform built with **FastAPI** and **Next.js**. 

## Features:
- ✨ Beautiful modern UI
- 🔐 User authentication
- 📝 Rich content creation
- 🏷️ Tag system
- ❤️ Like and comment system
- 👥 User profiles and following
- 🌙 Dark/light theme

Start sharing your knowledge and ideas with the community!""",
                "author": demo_user,
                "tags": ["Technology", "News"]
            },
            {
                "title": "Getting Started with FastAPI",
                "content": """# Getting Started with FastAPI

FastAPI is a modern, fast web framework for building APIs with Python.

## Installation:
```bash
pip install fastapi uvicorn
```

## Basic Example:
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}
```

FastAPI provides automatic API documentation, type checking, and high performance.""",
                "author": admin_user,
                "tags": ["Programming", "Python", "Tutorial"]
            },
            {
                "title": "Building Modern UIs with React",
                "content": """# Building Modern UIs with React

React is a powerful library for building user interfaces.

## Key Concepts:
- **Components**: Reusable UI pieces
- **Props**: Data passed to components
- **State**: Component data management
- **Hooks**: Modern React patterns

## Example Component:
```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

React makes building interactive UIs simple and efficient.""",
                "author": demo_user,
                "tags": ["Programming", "JavaScript", "React", "Design"]
            }
        ]
        
        for post_data in posts_data:
            existing_post = db.query(Post).filter(
                Post.title == post_data["title"],
                Post.author_id == post_data["author"].id
            ).first()
            
            if not existing_post:
                # Get tags for this post
                post_tags = []
                for tag_name in post_data["tags"]:
                    tag = db.query(Tag).filter(Tag.name == tag_name).first()
                    if tag:
                        post_tags.append(tag)
                
                post = Post(
                    title=post_data["title"],
                    content=post_data["content"],
                    author_id=post_data["author"].id,
                    tags=post_tags
                )
                db.add(post)
                print(f"Created post: {post_data['title']}")
        
        db.commit()
        print("\n✅ Sample data created successfully!")
        print("\nDemo credentials:")
        print("Username: demo, Password: demo123")
        print("Username: admin, Password: admin123")
        print("Username: moderator, Password: mod123")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()
        try:
            next(db_gen)  # Complete the generator
        except StopIteration:
            pass

if __name__ == "__main__":
    create_sample_data() 