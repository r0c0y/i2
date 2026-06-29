interface Step {
  key: string;
  label: string;
}

interface Props {
  steps: Step[];
  activeIndex: number;
  completedIndex: number;
}

export function PipelineSteps({ steps, activeIndex, completedIndex }: Props) {
  return (
    <div className="pipeline-steps">
      {steps.map((step, i) => {
        const isCompleted = i < completedIndex;
        const isActive = i === activeIndex;

        return (
          <div key={step.key}>
            <div
              className={`pipeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="pipeline-step-number">
                {isCompleted ? '✓' : i + 1}
              </div>
              <span>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="pipeline-connector" />
            )}
          </div>
        );
      })}
    </div>
  );
}
