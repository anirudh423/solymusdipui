import React, {useState, useRef, useEffect} from 'react'
import '../styles/StaticPages.css'

export default function Chat(){
  const [messages, setMessages] = useState([{from:'bot', text:'Hello — I\'m Solymus Assistant. How can I help today?'}])
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => { if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages])

  function send(){
    if(!input.trim()) return
    const user = {from:'user', text: input}
    setMessages(m=>[...m, user])
    setInput('')
    setTimeout(() => {
      setMessages(m=>[...m, {from:'bot', text: `Thanks for asking — we received: "${user.text}". A human will follow up.`}])
    }, 700)
  }

  return (
    <div className="static-root white-theme chat-root">
      <section className="static-hero">
        <div className="static-content">
          <h1>Chat with Solymus</h1>
          <p className="lead muted">A friendly assistant to help with quotes, coverage questions, and next steps.</p>
        </div>
      </section>

      <div className="chat-card card">
        <div className="chat-list" ref={listRef} role="log" aria-live="polite">
          {messages.map((m,i)=> (
            <div key={i} className={`chat-msg ${m.from==='bot' ? 'bot' : 'user'}`}><div className="chat-bubble">{m.text}</div></div>
          ))}
        </div>

        <div className="chat-input">
          <input aria-label="Type your message" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send() }} placeholder="Ask about your quote, policy, or coverage" />
          <button type="button" className="btn-purchase" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  )
}
