import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import ProgressSteps from '../components/ProgressSteps'

export default function Questions() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!state?.questions) { navigate('/'); return null }

  const { questions, jobRole } = state

 const allQuestions = [
    ...questions.technical.slice(0, 2).map(q => ({ q, type: 'technical' })),
    ...questions.hr.slice(0, 2).map(q => ({ q, type: 'hr' })),
    ...questions.skill.slice(0, 2).map(q => ({ q, type: 'skill' })),
  ]

  const handleSubmit = async () => {
    const unanswered = allQuestions.filter((_, i) => !answers[i] || !answers[i].trim())
    if (unanswered.length > 0) {
      setError('Please answer all questions before submitting.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data } = await axios.post('https://ai-resume-analyzer-server.onrender.com/evaluate', {
        questions: allQuestions.map(q => q.q),
        answers: allQuestions.map((_, i) => answers[i] || ''),
        jobRole,
      })
      navigate('/feedback', { state: { feedback: data.feedback, jobRole, questions } })
    } catch (err) {
      setError('Evaluation failed. Please try again.')
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="page">
      <ProgressSteps current={4} />
      <div className="container">
        <div className="loading">
          <div className="loading-spinner" />
          <h3>Evaluating your answers...</h3>
          <p>AI is reviewing your responses and preparing feedback.</p>
        </div>
      </div>
    </div>
  )

  const categories = [
    { key: 'technical', label: 'Technical', emoji: '💻', className: 'cat-technical' },
    { key: 'hr', label: 'HR', emoji: '🤝', className: 'cat-hr' },
    { key: 'skill', label: 'Skill Based', emoji: '⚡', className: 'cat-skill' },
  ]

  return (
    <div className="page">
      <ProgressSteps current={3} />
      <div className="container">
        <div className="page-header">
          <h1>Interview Practice</h1>
          <p>Answer these questions as you would in a real interview</p>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        {categories.map(({ key, label, emoji, className }) => {
          const catQuestions = allQuestions.filter(q => q.type === key)
          const startIndex = allQuestions.findIndex(q => q.type === key)
          return (
            <div className="card" key={key}>
              <div className="question-block">
                <div className={`question-category ${className}`}>
                  {emoji} {label} Questions
                </div>
                {catQuestions.map((item, idx) => {
                  const globalIdx = startIndex + idx
                  return (
                    <div className="question-item" key={globalIdx}>
                      <div className="question-number">Question {idx + 1}</div>
                      <div className="question-text">{item.q}</div>
                      <textarea
                        placeholder="Type your answer here..."
                        value={answers[globalIdx] || ''}
                        onChange={e => setAnswers({ ...answers, [globalIdx]: e.target.value })}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => navigate('/analysis', { state: { result: state.result, jobRole } })}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Submit Answers →
          </button>
        </div>
      </div>
    </div>
  )
}
