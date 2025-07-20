import yaml from 'js-yaml';

function toPythonType(field) {
  // crude mapping for demo
  if (field.toLowerCase().includes('id')) return 'int';
  if (field.toLowerCase().includes('count')) return 'int';
  return 'str';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'DeepSeek API key not set' });

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert app spec generator. Given a user prompt, output a YAML spec for a full-stack app in the Kiro format. Only output valid YAML.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });
    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: 'No spec generated.' });
    }
    // Extract YAML from the response
    let yamlText = data.choices[0].message.content.trim();
    if (yamlText.startsWith('```yaml')) yamlText = yamlText.replace(/^```yaml\s*/, '');
    if (yamlText.endsWith('```')) yamlText = yamlText.replace(/```$/, '');

    // Parse YAML and generate advanced code previews
    let backend = '';
    let frontend = '';
    try {
      const spec = yaml.load(yamlText);
      // Backend: SQLAlchemy models and FastAPI CRUD endpoints
      if (spec && spec.specs) {
        backend += 'from fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\nfrom typing import List, Optional\n\napp = FastAPI()\n\n';
        for (const entity of spec.specs) {
          // Model
          backend += `\nclass ${entity.name}(BaseModel):\n`;
          if (entity.inputs) {
            for (const field of entity.inputs) {
              backend += `    ${field}: ${toPythonType(field)}\n`;
            }
          }
          if (entity.outputs) {
            for (const field of entity.outputs) {
              backend += `    ${field}: Optional[${toPythonType(field)}] = None\n`;
            }
          }
          backend += '\n';
          // In-memory DB
          backend += `${entity.name.toLowerCase()}s_db = []\n`;
          // CRUD endpoints
          backend += `@app.get('/${entity.name.toLowerCase()}s', response_model=List[${entity.name}])\ndef list_${entity.name.toLowerCase()}s():\n    return ${entity.name.toLowerCase()}s_db\n`;
          backend += `@app.post('/${entity.name.toLowerCase()}s', response_model=${entity.name})\ndef create_${entity.name.toLowerCase()}(item: ${entity.name}):\n    ${entity.name.toLowerCase()}s_db.append(item)\n    return item\n`;
          backend += `@app.get('/${entity.name.toLowerCase()}s/{{item_id}}', response_model=${entity.name})\ndef get_${entity.name.toLowerCase()}(item_id: int):\n    for item in ${entity.name.toLowerCase()}s_db:\n        if getattr(item, 'id', None) == item_id:\n            return item\n    raise HTTPException(status_code=404, detail='Not found')\n`;
          backend += `@app.put('/${entity.name.toLowerCase()}s/{{item_id}}', response_model=${entity.name})\ndef update_${entity.name.toLowerCase()}(item_id: int, new_item: ${entity.name}):\n    for idx, item in enumerate(${entity.name.toLowerCase()}s_db):\n        if getattr(item, 'id', None) == item_id:\n            ${entity.name.toLowerCase()}s_db[idx] = new_item\n            return new_item\n    raise HTTPException(status_code=404, detail='Not found')\n`;
          backend += `@app.delete('/${entity.name.toLowerCase()}s/{{item_id}}')\ndef delete_${entity.name.toLowerCase()}(item_id: int):\n    for idx, item in enumerate(${entity.name.toLowerCase()}s_db):\n        if getattr(item, 'id', None) == item_id:\n            del ${entity.name.toLowerCase()}s_db[idx]\n            return {'ok': True}\n    raise HTTPException(status_code=404, detail='Not found')\n`;
        }
      }
      // Frontend: React list and create form for each entity
      if (spec && spec.specs) {
        frontend += `import React, { useState } from 'react';\n`;
        for (const entity of spec.specs) {
          // List page
          frontend += `\nexport function ${entity.name}List() {\n  const [items, setItems] = useState([]);\n  React.useEffect(() => {\n    fetch('/api/${entity.name.toLowerCase()}s').then(r => r.json()).then(setItems);\n  }, []);\n  return (<div><h2>${entity.name} List</h2><ul>{items.map((item, i) => <li key={i}>{JSON.stringify(item)}</li>)}</ul></div>);\n}\n`;
          // Create form
          frontend += `\nexport function Create${entity.name}() {\n  const [form, setForm] = useState({});\n  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));\n  const handleSubmit = e => {\n    e.preventDefault();\n    fetch('/api/${entity.name.toLowerCase()}s', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then(r => r.json()).then(console.log);\n  };\n  return (<form onSubmit={handleSubmit}><h3>Create ${entity.name}</h3>${(entity.inputs||[]).map(f => `<input name=\"${f}\" placeholder=\"${f}\" onChange={handleChange} />`).join('')}<button type='submit'>Create</button></form>);\n}\n`;
        }
        frontend += `\nexport default function Home() {\n  return <h1>Welcome to your generated app!</h1>;\n}\n`;
      }
    } catch (e) {
      backend = 'from fastapi import FastAPI\napp = FastAPI()\n';
      frontend = 'export default function Home() { return <h1>Welcome!</h1>; }';
    }

    res.status(200).json({ yaml: yamlText, backend, frontend });
  } catch (e) {
    res.status(500).json({ error: 'Failed to call DeepSeek API.' });
  }
} 