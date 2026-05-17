import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import ProgressSteps from '../components/ProgressSteps'

export default function Feedback() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  if (!state?.feedback) { navigate('/'); return null }

  const { feedback, jobRole, questions } = state

  const handleNewQuestions = async () => {
    setLoading(true)
    try {
      const { data } = await axios.post('http://localhost:5000/questions', { jobRole })
      navigate('/questions', { state: { questions: data, jobRole } })
    } catch (err) {
      alert('Failed to generate new questions. Please try again.')
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="page">
      <ProgressSteps current={3} />
      <div className="container">
        <div className="loading">
          <div className="loading-spinner" />
          <h3>Generating new questions...</h3>
          <p>Preparing a fresh set of interview questions.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <ProgressSteps current={4} />
      <div className="container">
        <div className="page-header">
          <h1>Answer Feedback</h1>
          <p>Review how you did and what to improve</p>
        </div>

        {feedback.map((item, i) => (
          <div className="feedback-card" key={i}>
            <div className="question-label">Question {i + 1}</div>
            <div className="question-q">{item.question}</div>

            <div className="answer-row your-answer">
              <div className="answer-label">❌ Your Answer</div>
              <div>{item.yourAnswer || 'No answer provided'}</div>
            </div>

            <div className="answer-row ideal-answer">
              <div className="answer-label">✅ Ideal Answer</div>
              <div>{item.idealAnswer}</div>
            </div>

            <div className="answer-row improvement">
              <div className="answer-label">💬 What to Improve</div>
              <div>{item.improvement}</div>
            </div>
          </div>
        ))}

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => navigate('/questions', { state: { questions, jobRole } })}>
            ← Go Back
          </button>
          <button className="btn btn-primary" onClick={handleNewQuestions}>
            Generate New Questions →
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/')}>
            Start Over with New Resume
          </button>
        </div>
      </div>
    </div>
  )
}
