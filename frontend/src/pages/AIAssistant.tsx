import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, Bot, User, Zap, Loader2 } from 'lucide-react'
import { sendChatMessage } from '../services/api'
import type { ChatMessage, MessageRole } from '../types'

function genId() {
  return Math.random().toString(36).slice(2)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const SUGGESTIONS = [
  'Create a 7-day study plan for Data Structures',
  'Generate a quiz on Machine Learning basics',
  'What are my pending tasks?',
  'Summarize my recent activity',
]

export default function AIAssistant() {
  const location = useLocation()
  const initialMessage = (location.state as { initialMessage?: string })?.initialMessage

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: genId(),
      role: 'assistant',
      content:
        "Hello! I'm your Smart Study Agent. I can help you create study plans, generate quizzes, manage tasks, and answer questions about your coursework. What would you like to do today?",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle initial message passed from Overview quick input
  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage)
      inputRef.current?.focus()
    }
  }, [initialMessage])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role as MessageRole, content: m.content }))
      const response = await sendChatMessage({ message: content, history })

      const botText = response.reply || (response as any).message || 'Action executed.'
      const assistantMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content: botText,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errMsg: ChatMessage = {
        id: genId(),
        role: 'assistant',
        content:
          err instanceof Error
            ? `Sorry, I encountered an error: ${err.message}`
            : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-3 mb-4 shadow-sm flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800">Smart Study Agent</div>
          <div className="text-xs text-green-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Online
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={16} className="text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div
                className={`text-[11px] mt-1.5 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {formatTime(msg.timestamp)}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={16} className="text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only shown when just 1 message) */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 py-3 flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded-full px-3 py-1.5 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-2 px-3 py-2 mt-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-400 text-slate-800"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-lg transition flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
