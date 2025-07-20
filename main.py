import os
import sys
from pathlib import Path
import yaml

KIRO_DIR = Path(".kiro")
SPECS_PATH = KIRO_DIR / "specs.yaml"

# --- NLP using DeepSeek API only ---
def nlp_to_spec(prompt):
    import openai
    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    if not deepseek_key:
        print("Error: Please set the DEEPSEEK_API_KEY environment variable.")
        sys.exit(1)
    client = openai.OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com/v1")
    model_name = "deepseek-chat"
    system_prompt = (
        "You are an expert app spec generator. "
        "Given a user prompt, extract features, entities, relations, and output a YAML spec in this format:\n"
        "specs:\n  - name: ...\n    description: ...\n    inputs: [...]\n    outputs: [...]\n    methods: [...]\n"
    )
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.2
    )
    import re
    import io
    content = response.choices[0].message.content
    if not isinstance(content, str):
        return fallback_spec()
    match = re.search(r"specs:[\s\S]+", content)
    if match:
        try:
            return yaml.safe_load(io.StringIO(match.group(0)))
        except Exception:
            pass
    return fallback_spec()

def fallback_spec():
    return {
        'specs': [
            {
                'name': 'User',
                'description': 'A user of the app',
                'inputs': ['username', 'password'],
                'outputs': ['user_id', 'created_at'],
                'methods': ['register', 'login']
            },
            {
                'name': 'Post',
                'description': 'A blog post written by a user',
                'inputs': ['title', 'content', 'user_id'],
                'outputs': ['post_id', 'created_at'],
                'methods': ['create', 'edit', 'delete']
            },
            {
                'name': 'Comment',
                'description': 'A comment on a post',
                'inputs': ['content', 'user_id', 'post_id'],
                'outputs': ['comment_id', 'created_at'],
                'methods': ['add', 'delete']
            }
        ]
    }

def write_yaml(data, path):
    with open(path, 'w') as f:
        yaml.dump(data, f)

def ensure_dirs():
    (KIRO_DIR / "hooks").mkdir(parents=True, exist_ok=True)
    (KIRO_DIR / "steering").mkdir(parents=True, exist_ok=True)
    Path("backend").mkdir(exist_ok=True)
    Path("frontend/pages").mkdir(parents=True, exist_ok=True)
    Path("tests").mkdir(exist_ok=True)

def main():
    ensure_dirs()
    if len(sys.argv) < 2:
        print("Usage: python main.py 'describe your app'")
        sys.exit(1)
    prompt = sys.argv[1]
    spec = nlp_to_spec(prompt)
    write_yaml(spec, SPECS_PATH)
    print(f"Spec written to {SPECS_PATH}")
    # TODO: Call backend and frontend generators

if __name__ == "__main__":
    main() 