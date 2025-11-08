import React, {useState} from 'react'
import '../styles/StaticPages.css'

export default function LeadForm(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  function validate(){
    if(!name.trim() || !email.trim() || !phone.trim()) return 'Please fill all fields.'
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Please enter a valid email.'
    if(!/^[0-9+\-()\s]{7,}$/.test(phone)) return 'Please enter a valid phone number.'
    return null
  }

  function onSubmit(e){
    e.preventDefault()
    const err = validate()
    if(err){ setError(err); return }
    setError(null)
    try{ localStorage.setItem('solymus_lead', JSON.stringify({name,email,phone,date:new Date().toISOString()})) }catch(e){}
    setSubmitted(true)
  }

  function downloadStub(){
    const content = `Insurer form download\nName:${name}\nEmail:${email}\nPhone:${phone}`
    const blob = new Blob([content], {type:'text/plain'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'insurer_form.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="static-root white-theme">
      <section className="static-hero">
        <div className="static-content">
          <h1>Unlock Insurer Forms</h1>
          <p className="lead muted">Provide a few details to unlock downloadable insurer forms.</p>
        </div>
      </section>

      <div className="card form-card">
        {!submitted ? (
          <form onSubmit={onSubmit}>
            <label className="muted">Name</label>
            <input aria-label="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
            <label className="muted">Email</label>
            <input aria-label="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <label className="muted">Phone</label>
            <input aria-label="Phone number" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            {error && <div className="status error" style={{marginTop:8}}>{error}</div>}
            <div style={{marginTop:12, display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button type="submit" className="btn-purchase">Submit</button>
            </div>
          </form>
        ) : (
          <div>
            <h3>Thanks, {name} — forms unlocked</h3>
            <p className="muted">You can now download insurer forms for offline use.</p>
            <div style={{marginTop:12, display:'flex', gap:8}}>
              <button type="button" className="btn-primary" onClick={downloadStub}>Download Form</button>
              <button type="button" className="btn-outline" onClick={()=>{ setSubmitted(false); setName(''); setEmail(''); setPhone('') }}>Submit another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
