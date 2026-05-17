export default function ProgressSteps({ current }) {
  const steps = ['Upload', 'Analysis', 'Questions', 'Feedback']

  return (
    <div className="progress-bar">
      {steps.map((step, i) => (
        <div
          key={step}
          className={`step ${i + 1 === current ? 'active' : i + 1 < current ? 'done' : ''}`}
        >
          <div className="step-circle">
            {i + 1 < current ? '✓' : i + 1}
          </div>
          <span className="step-label">{step}</span>
        </div>
      ))}
    </div>
  )
}
