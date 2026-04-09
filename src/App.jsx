import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="px-4 py-2 rounded-lg shadow-lg text-sm font-medium bg-gray-900 text-white max-w-xs"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const show = useCallback((message, duration = 3000) => {
    const id = generateId('toast')
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])
  return { toasts, show }
}

// ─── API key banner ──────────────────────────────────────────────────────────

function ApiKeyBar({ apiKey, setApiKey, onTest, testing }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-gray-500 whitespace-nowrap">Groq API Key</label>
      <input
        type={visible ? 'text' : 'password'}
        value={apiKey}
        onChange={e => setApiKey(e.target.value)}
        placeholder="gsk_..."
        className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => setVisible(v => !v)}
        className="px-2 py-1 text-gray-400 hover:text-gray-700"
        title={visible ? 'Hide' : 'Show'}
      >
        {visible ? '🙈' : '👁️'}
      </button>
      <button
        onClick={onTest}
        disabled={testing || !apiKey}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
      >
        {testing ? 'Testing…' : 'Test'}
      </button>
    </div>
  )
}

// ─── Card list sidebar ───────────────────────────────────────────────────────

function CardSidebar({ cards, chunks, selectedId, onSelect, onAdd, onGenerate, generating }) {
  return (
    <div className="flex flex-col h-full bg-gray-100 border-r border-gray-200">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <span className="font-semibold text-gray-700 text-sm">Cards</span>
        <span className="text-xs text-gray-400">{cards.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {cards.length === 0 && (
          <p className="p-4 text-xs text-gray-400 text-center">No cards yet.<br />Paste a speech and generate.</p>
        )}
        {cards.map((card, i) => {
          const chunk = chunks.find(c => c.id === card.chunkId)
          return (
            <button
              key={card.id}
              onClick={() => onSelect(card.id)}
              className={`w-full text-left px-3 py-2 border-b border-gray-200 hover:bg-gray-200 transition-colors ${selectedId === card.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
            >
              <div className="text-xs font-semibold text-gray-600 truncate">
                {i + 1}. {chunk?.heading || card.id}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {card.plannedTime ? `${card.plannedTime}s planned` : 'No timing'}
              </div>
            </button>
          )
        })}
      </div>
      <div className="p-2 flex flex-col gap-1 border-t border-gray-200">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating…' : '✨ Generate Cards'}
        </button>
        <button
          onClick={onAdd}
          className="w-full px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
        >
          + Add Card
        </button>
      </div>
    </div>
  )
}

// ─── Card editor ─────────────────────────────────────────────────────────────

function CardEditor({ card, chunk, speechText, onUpdate, onDelete, onRegenerate, regenerating }) {
  if (!card) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a card or generate cards from your speech.
      </div>
    )
  }

  const excerpt = chunk
    ? speechText.slice(chunk.startIndex, chunk.endIndex)
    : ''

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {/* Chunk heading */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Section</div>
          <input
            value={chunk?.heading || ''}
            onChange={e => onUpdate({ chunkHeading: e.target.value })}
            className="text-lg font-bold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none bg-transparent w-full"
          />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            title="Regenerate cues from AI"
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {regenerating ? '…' : '↺ Regen'}
          </button>
          <button
            onClick={onDelete}
            title="Delete card"
            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Speech excerpt */}
      {excerpt && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600 max-h-36 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Speech excerpt</div>
          {excerpt}
        </div>
      )}

      {/* Summary */}
      {chunk?.coreSummary && (
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Summary</div>
          <textarea
            value={chunk.coreSummary}
            onChange={e => onUpdate({ coreSummary: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          />
        </div>
      )}

      {/* Cue type toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Cue type:</span>
        <button
          onClick={() => onUpdate({ cueType: card.cueType === 'minimal' ? 'full' : 'minimal' })}
          className={`px-3 py-0.5 text-xs rounded-full border ${card.cueType === 'minimal' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-amber-100 border-amber-300 text-amber-700'}`}
        >
          {card.cueType === 'minimal' ? 'Minimal' : 'Full Notes'}
        </button>
      </div>

      {/* Direct extracts */}
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-blue-400"></span> Direct Extracts (exact quotes)
        </div>
        {(card.directExtracts || []).map((q, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input
              value={q}
              onChange={e => {
                const updated = [...card.directExtracts]
                updated[i] = e.target.value
                onUpdate({ directExtracts: updated })
              }}
              className="flex-1 border border-blue-200 bg-blue-50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={() => {
                const updated = card.directExtracts.filter((_, j) => j !== i)
                onUpdate({ directExtracts: updated })
              }}
              className="text-gray-400 hover:text-red-500 px-1"
            >×</button>
          </div>
        ))}
        <button
          onClick={() => onUpdate({ directExtracts: [...(card.directExtracts || []), ''] })}
          className="text-xs text-blue-500 hover:underline"
        >+ Add quote</button>
      </div>

      {/* Prompts */}
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-orange-400"></span> Prompts (delivery actions)
        </div>
        {(card.prompts || []).map((p, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input
              value={p}
              onChange={e => {
                const updated = [...card.prompts]
                updated[i] = e.target.value
                onUpdate({ prompts: updated })
              }}
              className="flex-1 border border-orange-200 bg-orange-50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button
              onClick={() => {
                const updated = card.prompts.filter((_, j) => j !== i)
                onUpdate({ prompts: updated })
              }}
              className="text-gray-400 hover:text-red-500 px-1"
            >×</button>
          </div>
        ))}
        <button
          onClick={() => onUpdate({ prompts: [...(card.prompts || []), ''] })}
          className="text-xs text-orange-500 hover:underline"
        >+ Add prompt</button>
      </div>

      {/* Concepts */}
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-400"></span> Concepts (key reminders)
        </div>
        {(card.concepts || []).map((c, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input
              value={c}
              onChange={e => {
                const updated = [...card.concepts]
                updated[i] = e.target.value
                onUpdate({ concepts: updated })
              }}
              className="flex-1 border border-green-200 bg-green-50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <button
              onClick={() => {
                const updated = card.concepts.filter((_, j) => j !== i)
                onUpdate({ concepts: updated })
              }}
              className="text-gray-400 hover:text-red-500 px-1"
            >×</button>
          </div>
        ))}
        <button
          onClick={() => onUpdate({ concepts: [...(card.concepts || []), ''] })}
          className="text-xs text-green-600 hover:underline"
        >+ Add concept</button>
      </div>

      {/* Full notes (only when cueType === 'full') */}
      {card.cueType === 'full' && (
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Full Notes</div>
          <textarea
            value={card.fullNotes || ''}
            onChange={e => onUpdate({ fullNotes: e.target.value })}
            rows={5}
            placeholder="Write full notes for this section…"
            className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          />
        </div>
      )}

      {/* Planned time */}
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Planned Time (seconds)</div>
        <input
          type="number"
          value={card.plannedTime || ''}
          onChange={e => onUpdate({ plannedTime: parseInt(e.target.value) || 0 })}
          className="w-24 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
    </div>
  )
}

// ─── Right panel ─────────────────────────────────────────────────────────────

function RightPanel({ speech, onExport, onImportFile, onRehearse }) {
  const fileRef = useRef()
  const totalWords = countWords(speech.text)
  const totalPlanned = speech.cards.reduce((s, c) => s + (c.plannedTime || 0), 0)
  const mins = Math.floor(totalPlanned / 60)
  const secs = totalPlanned % 60

  return (
    <div className="w-48 flex-shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col gap-3 p-3">
      <div className="text-xs text-gray-500 space-y-1">
        <div>{totalWords} words</div>
        <div>{speech.cards.length} cards</div>
        {totalPlanned > 0 && <div>~{mins}m {secs}s planned</div>}
      </div>

      <hr className="border-gray-200" />

      <button
        onClick={onRehearse}
        disabled={speech.cards.length === 0}
        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 font-medium"
      >
        ▶ Rehearse
      </button>

      <hr className="border-gray-200" />

      <button
        onClick={onExport}
        className="w-full px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-100"
      >
        ⬇ Export .md
      </button>

      <button
        onClick={() => fileRef.current.click()}
        className="w-full px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-100"
      >
        ⬆ Import .md
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.txt"
        className="hidden"
        onChange={e => {
          if (e.target.files[0]) {
            onImportFile(e.target.files[0])
            e.target.value = ''
          }
        }}
      />
    </div>
  )
}

// ─── Groq API ────────────────────────────────────────────────────────────────

async function callGroq(apiKey, prompt, showToast) {
  const key = (apiKey || '').trim()
  if (!key) { showToast('❌ API key required'); return null }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      showToast('❌ API Error: ' + (err.error?.message || res.status))
      return null
    }
    const data = await res.json()
    return data.choices[0].message.content
  } catch (e) {
    showToast('❌ Network error: ' + e.message)
    return null
  }
}

function parseJSON(raw) {
  if (!raw) return null
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  try { return JSON.parse(cleaned) } catch { return null }
}

// ─── Export / Import ─────────────────────────────────────────────────────────

function exportToMarkdown(speech) {
  const meta = JSON.stringify({
    title: speech.metadata.title,
    duration: speech.metadata.duration,
    wordCount: speech.metadata.wordCount,
    speakingSpeed: speech.metadata.speakingSpeed,
    createdAt: speech.metadata.createdAt,
    exportVersion: speech.metadata.exportVersion,
    chunks: speech.chunks,
    cards: speech.cards,
    rehearsalLogs: speech.rehearsalLogs,
  }, null, 2)

  let body = `---\n${meta}\n---\n\n`

  speech.cards.forEach((card, i) => {
    const chunk = speech.chunks.find(c => c.id === card.chunkId)
    const excerpt = chunk ? speech.text.slice(chunk.startIndex, chunk.endIndex) : ''
    body += `# ${chunk?.heading || `Card ${i + 1}`}\n\n`
    if (excerpt) body += `${excerpt}\n\n`
    body += `**Cue Card:**\n`
    ;(card.directExtracts || []).forEach(q => { body += `- Direct quote: "${q}"\n` })
    ;(card.prompts || []).forEach(p => { body += `- Prompt: ${p}\n` })
    ;(card.concepts || []).forEach(c => { body += `- Concept: ${c}\n` })
    if (card.plannedTime) body += `\n_Planned: ${card.plannedTime}s_\n`
    body += '\n---\n\n'
  })

  return body
}

function importFromMarkdown(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  try {
    const meta = JSON.parse(match[1])
    const fullText = text.replace(/^---\n[\s\S]*?\n---\n?/, '')
    return {
      text: fullText.replace(/^# .*\n[\s\S]*?---\n/gm, '').trim(),
      metadata: {
        title: meta.title || '',
        duration: meta.duration || 0,
        wordCount: meta.wordCount || 0,
        speakingSpeed: meta.speakingSpeed || 130,
        createdAt: meta.createdAt || new Date().toISOString(),
        exportVersion: meta.exportVersion || 1,
      },
      chunks: meta.chunks || [],
      cards: meta.cards || [],
      rehearsalLogs: meta.rehearsalLogs || [],
    }
  } catch { return null }
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_SPEECH = {
  text: '',
  metadata: {
    title: '',
    duration: 0,
    wordCount: 0,
    speakingSpeed: 130,
    createdAt: new Date().toISOString(),
    exportVersion: 1,
  },
  chunks: [],
  cards: [],
  rehearsalLogs: [],
  unsavedChanges: false,
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { toasts, show: showToast } = useToast()
  const [apiKey, setApiKey] = useState(() => (localStorage.getItem('groq_api_key') || '').trim())
  const [testing, setTesting] = useState(false)
  const [speech, setSpeech] = useState(() => {
    try {
      const saved = localStorage.getItem('cadence_state')
      return saved ? JSON.parse(saved) : DEFAULT_SPEECH
    } catch { return DEFAULT_SPEECH }
  })
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('cadence_state', JSON.stringify(speech))
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 1200)
    }, 800)
    return () => clearTimeout(timer)
  }, [speech])

  // Persist API key
  useEffect(() => {
    if (apiKey) localStorage.setItem('groq_api_key', apiKey)
  }, [apiKey])

  // Selected card + chunk
  const selectedCard = speech.cards.find(c => c.id === selectedCardId) || null
  const selectedChunk = selectedCard ? speech.chunks.find(ch => ch.id === selectedCard.chunkId) : null

  // ── Test connection ──
  const testConnection = async () => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) { showToast('❌ Enter an API key first'); return }
    setTesting(true)
    try {
      // Use models list endpoint — only checks auth, no model dependency
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` },
      })
      if (res.ok) {
        setApiKey(trimmedKey)
        localStorage.setItem('groq_api_key', trimmedKey)
        showToast('✅ Connection successful!')
      } else {
        const err = await res.json().catch(() => null)
        const msg = err?.error?.message || `HTTP ${res.status}`
        showToast(`❌ ${msg}`)
      }
    } catch (e) {
      showToast('❌ Network error: ' + e.message)
    }
    setTesting(false)
  }

  // ── Generate cards ──
  const generateCards = async () => {
    if (!speech.text.trim()) { showToast('❌ Paste your speech first'); return }
    setGenerating(true)
    showToast('Chunking speech…')

    const chunkPrompt = `Analyze this speech and chunk it into logical ideas/topics.
Each chunk = one coherent argument (don't split mid-sentence).
Return ONLY valid JSON (no markdown, no backticks):
{
  "chunks": [
    {
      "heading": "The Problem",
      "startIdx": 0,
      "endIdx": 250,
      "coreSummary": "Description of this section"
    }
  ]
}

Speech:
${speech.text}`

    const rawChunks = await callGroq(apiKey, chunkPrompt, showToast)
    const parsed = parseJSON(rawChunks)
    if (!parsed?.chunks) {
      showToast('❌ Failed to parse chunks. Try again.')
      setGenerating(false)
      return
    }

    const chunks = parsed.chunks.map(c => ({
      id: generateId('chunk'),
      heading: c.heading,
      startIndex: c.startIdx,
      endIndex: c.endIdx,
      coreSummary: c.coreSummary || '',
      mergeHistory: [],
    }))

    // Generate cues for each chunk
    showToast(`Generating cues for ${chunks.length} sections…`)
    const cards = []
    for (const chunk of chunks) {
      const excerpt = speech.text.slice(chunk.startIndex, chunk.endIndex)
      const cuePrompt = `For this speech excerpt, extract ONLY JSON (no markdown):
{
  "directExtracts": ["exact quote 1", "exact quote 2"],
  "prompts": ["pause for effect", "slow down"],
  "concepts": ["emphasize urgency", "talk about impact"]
}

Rules:
- Quotes: 2-8 words EXACTLY from the text
- Prompts: Specific delivery actions (pause, lower voice, make eye contact, etc.)
- Concepts: General reminders (no more than 5 words each)
- Return ONLY JSON, no preamble

Speech excerpt:
${excerpt}`

      const rawCues = await callGroq(apiKey, cuePrompt, showToast)
      const cues = parseJSON(rawCues) || { directExtracts: [], prompts: [], concepts: [] }

      const wpm = speech.metadata.speakingSpeed || 130
      const words = countWords(excerpt)
      const plannedTime = Math.round((words / wpm) * 60)

      cards.push({
        id: generateId('card'),
        chunkId: chunk.id,
        cueType: 'minimal',
        directExtracts: cues.directExtracts || [],
        prompts: cues.prompts || [],
        concepts: cues.concepts || [],
        fullNotes: '',
        plannedTime,
        colorTags: [],
      })
    }

    setSpeech(prev => ({
      ...prev,
      chunks,
      cards,
      metadata: { ...prev.metadata, wordCount: countWords(prev.text) },
    }))
    if (cards.length > 0) setSelectedCardId(cards[0].id)
    showToast(`✅ Generated ${cards.length} cards!`)
    setGenerating(false)
  }

  // ── Add blank card ──
  const addCard = () => {
    const chunk = {
      id: generateId('chunk'),
      heading: 'New Section',
      startIndex: 0,
      endIndex: 0,
      coreSummary: '',
      mergeHistory: [],
    }
    const card = {
      id: generateId('card'),
      chunkId: chunk.id,
      cueType: 'minimal',
      directExtracts: [],
      prompts: [],
      concepts: [],
      fullNotes: '',
      plannedTime: 60,
      colorTags: [],
    }
    setSpeech(prev => ({ ...prev, chunks: [...prev.chunks, chunk], cards: [...prev.cards, card] }))
    setSelectedCardId(card.id)
  }

  // ── Update card/chunk ──
  const updateCard = useCallback((cardId, changes) => {
    setSpeech(prev => {
      const cards = prev.cards.map(c => c.id === cardId ? { ...c, ...changes } : c)
      let chunks = prev.chunks
      if (changes.chunkHeading !== undefined || changes.coreSummary !== undefined) {
        const card = prev.cards.find(c => c.id === cardId)
        chunks = prev.chunks.map(ch =>
          ch.id === card?.chunkId
            ? {
                ...ch,
                ...(changes.chunkHeading !== undefined ? { heading: changes.chunkHeading } : {}),
                ...(changes.coreSummary !== undefined ? { coreSummary: changes.coreSummary } : {}),
              }
            : ch
        )
      }
      return { ...prev, cards, chunks }
    })
  }, [])

  // ── Delete card ──
  const deleteCard = useCallback((cardId) => {
    setSpeech(prev => {
      const card = prev.cards.find(c => c.id === cardId)
      return {
        ...prev,
        cards: prev.cards.filter(c => c.id !== cardId),
        chunks: prev.chunks.filter(ch => ch.id !== card?.chunkId),
      }
    })
    setSelectedCardId(null)
  }, [])

  // ── Regenerate cues for one card ──
  const regenerateCard = async (cardId) => {
    const card = speech.cards.find(c => c.id === cardId)
    const chunk = speech.chunks.find(c => c.id === card?.chunkId)
    if (!card || !chunk) return
    setRegenerating(true)
    const excerpt = speech.text.slice(chunk.startIndex, chunk.endIndex)
    const cuePrompt = `For this speech excerpt, extract ONLY JSON (no markdown):
{
  "directExtracts": ["exact quote 1"],
  "prompts": ["delivery action"],
  "concepts": ["key reminder"]
}
Rules: Quotes 2-8 words from text. Prompts = delivery actions. Concepts ≤ 5 words. ONLY JSON.

Speech excerpt:
${excerpt}`
    const raw = await callGroq(apiKey, cuePrompt, showToast)
    const cues = parseJSON(raw)
    if (!cues) { showToast('❌ Regen failed'); setRegenerating(false); return }
    updateCard(cardId, {
      directExtracts: cues.directExtracts || [],
      prompts: cues.prompts || [],
      concepts: cues.concepts || [],
    })
    showToast('✅ Cues regenerated')
    setRegenerating(false)
  }

  // ── Export ──
  const handleExport = () => {
    const md = exportToMarkdown(speech)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${speech.metadata.title || 'cadence-speech'}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('✅ Exported!')
  }

  // ── Import ──
  const handleImportFile = (file) => {
    const reader = new FileReader()
    reader.onload = e => {
      const imported = importFromMarkdown(e.target.result)
      if (!imported) { showToast('❌ Could not parse file'); return }
      setSpeech(imported)
      setSelectedCardId(imported.cards[0]?.id || null)
      showToast('✅ Imported!')
    }
    reader.readAsText(file)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-bold text-blue-600">Cadence</span>
          {savedIndicator && <span className="text-xs text-green-500">Saved</span>}
        </div>

        <div className="flex-1 min-w-0">
          <ApiKeyBar
            apiKey={apiKey}
            setApiKey={setApiKey}
            onTest={testConnection}
            testing={testing}
          />
        </div>

        <div className="flex-shrink-0">
          <input
            value={speech.metadata.title}
            onChange={e => setSpeech(prev => ({ ...prev, metadata: { ...prev.metadata, title: e.target.value } }))}
            placeholder="Speech title…"
            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: card list */}
        <div className="w-44 flex-shrink-0 flex flex-col">
          <CardSidebar
            cards={speech.cards}
            chunks={speech.chunks}
            selectedId={selectedCardId}
            onSelect={setSelectedCardId}
            onAdd={addCard}
            onGenerate={generateCards}
            generating={generating}
          />
        </div>

        {/* Center: speech input + card editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Speech input */}
          <div className="flex-shrink-0 border-b border-gray-100 p-3">
            <textarea
              value={speech.text}
              onChange={e => setSpeech(prev => ({
                ...prev,
                text: e.target.value,
                metadata: { ...prev.metadata, wordCount: countWords(e.target.value) },
              }))}
              placeholder="Paste your speech here…"
              rows={5}
              className="w-full border border-gray-200 rounded p-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
            />
            <div className="text-xs text-gray-400 mt-1">{countWords(speech.text)} words</div>
          </div>

          {/* Card editor */}
          <div className="flex-1 overflow-hidden flex">
            <CardEditor
              card={selectedCard}
              chunk={selectedChunk}
              speechText={speech.text}
              onUpdate={(changes) => selectedCard && updateCard(selectedCard.id, changes)}
              onDelete={() => selectedCard && deleteCard(selectedCard.id)}
              onRegenerate={() => selectedCard && regenerateCard(selectedCard.id)}
              regenerating={regenerating}
            />
          </div>
        </div>

        {/* Right panel */}
        <RightPanel
          speech={speech}
          onExport={handleExport}
          onImportFile={handleImportFile}
          onRehearse={() => showToast('Rehearse mode coming in Phase 3!')}
        />
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}
