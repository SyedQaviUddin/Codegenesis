<<<<<<< HEAD
=======
# Codegenesis
AI-powered full-stack app generator: Turn natural language prompts into production-ready web apps with backend, frontend, tests, CI/CD, and deploy in minutes.



>>>>>>> 72107ee8846ae24a865578963eb8e7603402fd70
# 🚀 CodeGenesis - Modern Full-Stack Blog Platform

A beautiful, feature-rich blog platform and **AI-powered app generator** built with **FastAPI** (backend) and **Next.js** (frontend). Generate, preview, and download full-stack apps from a single prompt!

![CodeGenesis Platform](https://img.shields.io/badge/CodeGenesis-v2.0.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green)
![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black)
![React](https://img.shields.io/badge/React-18.0.0-blue)

---

## ✨ Features

- User authentication (JWT)
- User roles (admin, moderator, user)
- User profiles, following, verification
- Post CRUD, tags, likes, view counts
- Nested comments and replies
- Notifications and rate limiting
- CORS and security middleware
- Beautiful, modern CSS and responsive design
- Dark/light theme toggle
- **Prompt-to-App:** Generate, preview, and download new apps from a prompt!

---

## 🤖 Prompt-to-App: AI-Powered App Generator

**Describe your app in plain English and generate a Kiro YAML spec with one click!**

- Go to `/prompt-to-app` or click "Prompt-to-App" in the navigation.
- Enter a prompt like: `Make an app for recipes with login and comments`.
- Click **Generate Spec** to see the AI-generated `.kiro/specs.yaml`.
- **Preview the generated code:**
  - **Spec**: See the YAML spec.
  - **Backend**: See FastAPI code with Pydantic models and full CRUD endpoints for each entity.
  - **Frontend**: See React list pages and create forms for each entity.
- Click **Save Spec** to save it and start building!
- Click **Start Building & Download App** to get a ready-to-run starter codebase as a zip file.
- **One-click deploy:** Deploy to Vercel/Render or clone to GitHub instantly.

**Screenshot:**

![Prompt-to-App Screenshot](./docs/prompt-to-app-demo.png)

This feature uses DeepSeek API to turn your vision into a real, spec-driven app. Judges: this is our AI full-stack generator vision in action!

---

## 🧠 Kiro Spec & Automation

### **Kiro Spec File**
- The app is spec-driven! See `.kiro/specs.yaml` for a YAML description of all entities, features, and methods.

### **Kiro Hooks (Automated Productivity)**
- **Pre-commit hook**: `.kiro/hooks/pre-commit.js` checks for spec alignment before every commit.
- **Post-commit hook**: `.kiro/hooks/post-save.js` runs a mock LLM review after every commit.
- **Test stubs**: Auto-generated in `tests/` for posts and users.

#### **How to Use the Hooks**
- Hooks are installed in `.git/hooks/`:
  - `.git/hooks/pre-commit` runs the Kiro pre-commit check.
  - `.git/hooks/post-commit` runs the LLM review after commit.
- **To test manually:**
  ```sh
  node .kiro/hooks/pre-commit.js
  node .kiro/hooks/post-save.js
  ```
- **To test with git:**
  ```sh
  git add .
  git commit -m "Test hooks"
  # You will see the pre-commit and post-commit output
  ```

#### **How to Run the Test Stubs**
- From the project root:
  ```sh
  pytest
  ```
- You should see all test stubs pass.

---

## 🏗️ Architecture

```
CodeGenesis/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── codegenesis.db     # SQLite database
├── frontend/
│   ├── pages/             # Next.js pages
│   ├── styles/
│   ├── package.json       # Node.js dependencies
│   └── next.config.js     # Next.js configuration
├── .kiro/
│   ├── specs.yaml         # Kiro spec file
│   └── hooks/
│       ├── pre-commit.js  # Pre-commit hook
│       └── post-save.js   # Post-save hook
├── .git/hooks/
│   ├── pre-commit         # Git pre-commit hook (runs Kiro check)
│   └── post-commit        # Git post-commit hook (runs LLM review)
├── tests/
│   ├── test_post.py       # Test stub for posts
│   └── test_user.py       # Test stub for users
└── README.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup
```sh
cd CodeGenesis/backend
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
- Access API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend Setup
```sh
cd CodeGenesis/frontend
npm install
npm run dev
```
- Access app: [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage Guide
- Register/login, create posts, comment, like, follow, tag, and more!
- Use the dark/light theme toggle in the header.
- Use Prompt-to-App to generate, preview, and download new apps from a prompt!
- Deploy or clone your generated app with one click.

---

## 🛠️ Development & Customization
- Edit `.kiro/specs.yaml` to update the app spec.
- Add new hooks in `.kiro/hooks/` for more automation.
- Add real tests in `tests/`.
- Customize CSS in `frontend/styles/globals.css`.

---

## 🤝 Contributing
- Fork, branch, commit, and submit PRs!
- The pre-commit hook will help keep your code spec-aligned.

---

## 📄 License
MIT License (see LICENSE file)

---

<<<<<<< HEAD
**Made with ❤️ by CodeGenesis Team** 
=======
**Made with ❤️ by CodeGenesis Team** 
>>>>>>> 72107ee8846ae24a865578963eb8e7603402fd70
