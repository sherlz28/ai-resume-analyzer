import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import ProgressSteps from '../components/ProgressSteps'

const BASE_URL = 'https://ai-resume-analyzer-vayd.onrender.com'

export default function Analysis() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!state?.result) { navigate('/'); return null }

  const { result, jobRole } = state

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent Resume!'
    if (score >= 6) return 'Good Resume'
    if (score >= 4) return 'Needs Improvement'
    return 'Major Revision Needed'
  }

  const getScoreDesc = (score) => {
    if (score >= 8) return 'Your resume is well-structured and competitive for this role.'
    if (score >= 6) return 'Your resume is solid but has room for improvement.'
    if (score >= 4) return 'Several areas need attention before applying.'
    return 'Consider a significant rewrite with the suggestions below.'
  }

  const handleGenerateQuestions = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post(BASE_URL + '/questions', { jobRole })
      navigate('/questions', { state: { questions: data, jobRole } })
    } catch (err) {
      setError('Failed to generate questions. Please try again.')
      console.error(err)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="page">
      <ProgressSteps current={3} />
      <div className="container">
        <div className="loading">
          <div className="loading-spinner" />
          <h3>Generating interview questions...</h3>
          <p>Preparing questions tailored to your job role.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <ProgressSteps current={2} />
      <div className="container">
        <div className="page-header">
          <h1>Analysis Results</h1>
          <p>AI feedback for <strong>{jobRole}</strong> role</p>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <div className="score-section">
          <div className="score-circle">
            <span className="score-number">{result.score}</span>
            <span className="score-denom">out of 10</span>
          </div>
          <div className="score-text">
            <h2>{getScoreLabel(result.score)}</h2>
            <p>{getScoreDesc(result.score)}</p>
          </div>
        </div>

        <div className="card">
          <div className="feedback-section">
            <h3>🟢 Strengths</h3>
            <ul className="feedback-list strengths">
              {result.strengths.map((s, i) => (
                <li key={i}><span>✓</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <hr />
          <div className="feedback-section">
            <h3>🔴 Weaknesses</h3>
            <ul className="feedback-list weaknesses">
              {result.weaknesses.map((w, i) => (
                <li key={i}><span>✗</span><span>{w}</span></li>
              ))}
            </ul>
          </div>
          <hr />
          <div className="feedback-section">
            <h3>💡 Suggestions</h3>
            <ul className="feedback-list suggestions">
              {result.suggestions.map((s, i) => (
                <li key={i}><span>→</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>← Upload Again</button>
          <button className="btn btn-gold" onClick={handleGenerateQuestions}>Generate Interview Questions →</button>
        </div>
      </div>
    </div>
  )
}