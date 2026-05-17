const express = require('express')
const multer = require('multer')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// Create uploads folder if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx']

    const ext = path.extname(file.originalname).toLowerCase()

    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'))
    }
  }
})

// Extract text from file
async function extractText(filePath, ext) {

  if (ext === '.pdf') {

    const pdfParse = require('pdf-parse')

    const dataBuffer = fs.readFileSync(filePath)

    const data = await pdfParse(dataBuffer)

    return data.text
  }

  else if (ext === '.docx') {

    const mammoth = require('mammoth')

    const result = await mammoth.extractRawText({
      path: filePath
    })

    return result.value
  }

  return ''
}

// Call AI API
async function callGemini(prompt) {

  const Groq = require('groq-sdk')

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  })

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],

    model: 'llama-3.3-70b-versatile',
  })

  return completion.choices[0].message.content
}

// =========================================
// ROUTE 1 — ANALYZE RESUME
// =========================================

app.post('/analyze', upload.single('resume'), async (req, res) => {

  try {

    const { jobRole } = req.body

    const file = req.file

    const ext = path.extname(file.originalname).toLowerCase()

    const resumeText = await extractText(file.path, ext)

    // Cleanup uploaded file
    fs.unlinkSync(file.path)

    const prompt = `
You are a professional resume reviewer.

Analyze this resume for the job role:
"${jobRole}"

Resume content:
${resumeText}

Respond ONLY in this exact JSON format:

{
  "score": <number between 1 and 10>,
  "strengths": ["point 1", "point 2", "point 3"],
  "weaknesses": ["point 1", "point 2", "point 3"],
  "suggestions": ["point 1", "point 2", "point 3"]
}

Rules:
- No extra text
- No markdown
- Keep points short and actionable
`

    const raw = await callGemini(prompt)

    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const result = JSON.parse(cleaned)

    res.json(result)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: err.message
    })
  }
})

// =========================================
// ROUTE 2 — GENERATE INTERVIEW QUESTIONS
// =========================================

app.post('/questions', async (req, res) => {

  try {

    const { jobRole, resumeText } = req.body

    const prompt = `
You are an expert interviewer.

Generate interview questions for a "${jobRole}" candidate.

Resume summary:
${resumeText || 'Not provided'}

Respond ONLY in this exact JSON format:

{
  "technical": ["question 1", "question 2"],
  "hr": ["question 1", "question 2"],
  "skill": ["question 1", "question 2"]
}

Rules:
- No extra text
- No markdown
- Questions should be realistic and role-specific
`

    const raw = await callGemini(prompt)

    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const result = JSON.parse(cleaned)

    res.json(result)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: err.message
    })
  }
})

// =========================================
// ROUTE 3 — EVALUATE ANSWERS
// =========================================

app.post('/evaluate', async (req, res) => {

  try {

    const { questions, answers, jobRole } = req.body

    const qaList = questions
      .map((q, i) => {
        return `
Q${i + 1}: ${q}

A${i + 1}: ${answers[i] || 'No answer provided'}
`
      })
      .join('\n\n')

    const prompt = `
You are a supportive and encouraging interview coach evaluating answers for a "${jobRole}" position.

${qaList}

Respond ONLY in this exact JSON format:

{
  "feedback": [
    {
      "question": "the question",
      "yourAnswer": "the candidate answer",
      "idealAnswer": "what a strong answer looks like",
      "improvement": "one encouraging improvement tip"
    }
  ]
}

Important Rules:
- Encourage the candidate
- Mention positives first
- Keep idealAnswer short
- Keep improvement constructive
- No markdown
- No extra text
`

    const raw = await callGemini(prompt)

    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const result = JSON.parse(cleaned)

    res.json(result)

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: err.message
    })
  }
})

// =========================================
// START SERVER
// =========================================

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})