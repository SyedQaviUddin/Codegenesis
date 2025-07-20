import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { yaml } = req.body;
  if (!yaml) return res.status(400).json({ error: 'YAML required' });
  try {
    const kiroDir = path.join(process.cwd(), '.kiro');
    if (!fs.existsSync(kiroDir)) fs.mkdirSync(kiroDir);
    fs.writeFileSync(path.join(kiroDir, 'specs.yaml'), yaml, 'utf8');
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save spec.' });
  }
} 