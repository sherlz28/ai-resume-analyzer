import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ProgressSteps from '../components/ProgressSteps'

const JOB_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Business Analyst',
  'Cloud Engineer',
  'Cybersecurity Analyst',
  'Mobile App Developer',
  'Other (type below)',
]

export default function Upload() {
  const [file, setFile] = useState(null)
  const [jobRole, setJobRole] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()
  const navigate = useNavigate()

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }
    setError('')
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload your resume.'); return }
    const role = jobRole === 'Other (type below)' ? customRole : jobRole
    if (!role) { setError('Please select or enter a job role.'); return }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('resume', file)
    formData.append('jobRole', role)

    try {
      const { data } = await axios.post('http://localhost:5000/analyze', formData)
      navigate('/analysis', { state: { result: data, jobRole: role } })
    } catch (err) {
      setError('Analysis failed. Make sure the server is running.')
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="page">
      <ProgressSteps current={1} />
      <div className="container">
        <div className="loading">
          <div className="loading-spinner" />
          <h3>Analyzing your resume...</h3>
          <p>Our AI is reviewing your resume. This takes a few seconds.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <ProgressSteps current={1} />
      <div className="container">
        <div className="page-header">
          <h1>Resume Analyzer</h1>
          <p>Upload your resume and get AI-powered feedback instantly</p>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <div className="card">
          <div className="form-group">
            <label>Upload Resume</label>
            <div
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              <div className="upload-icon">📄</div>
              <h3>Drop your resume here</h3>
              <p>Supports PDF and DOCX formats • Click or drag to upload</p>
            </div>

            {file && (
              <div className="file-selected">
                <span>{file.name.endsWith('.pdf') ? '📕' : '📘'}</span>
                <span className="file-name">{file.name}</span>
                <button className="file-remove" onClick={() => setFile(null)}>✕</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Job Role</label>
            <select value={jobRole} onChange={e => setJobRole(e.target.value)}>
              <option value="">Select a job role...</option>
              {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {jobRole === 'Other (type below)' && (
            <div className="form-group">
              <label>Enter Your Job Role</label>
              <input
                placeholder="e.g. Embedded Systems Engineer"
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
              />
            </div>
          )}

          <button className="btn btn-primary" onClick={handleAnalyze}>
            Analyze Resume →
          </button>
        </div>
      </div>
    </div>
  )
}
