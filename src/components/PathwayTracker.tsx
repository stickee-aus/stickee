import type { PathwayStage } from '@/types/leaders'

interface PathwayTrackerProps {
  currentStage: PathwayStage
  completedStages: PathwayStage[]
}

const STAGES: PathwayStage[] = [
  'Community Contributor',
  'Local Council',
  'State Level',
  'Federal Level',
]

export function PathwayTracker({ currentStage, completedStages }: PathwayTrackerProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex items-start min-w-0 gap-0">
        {STAGES.map((stage, i) => {
          const isCompleted = completedStages.includes(stage)
          const isCurrent   = stage === currentStage
          const isLast      = i === STAGES.length - 1

          return (
            <div key={stage} className="flex items-start flex-1 min-w-0">
              {/* Node + label */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={[
                    'h-3 w-3 rounded-full border-2 transition-colors',
                    isCompleted || isCurrent
                      ? 'bg-primary border-primary'
                      : 'bg-transparent border-border/50',
                    isCurrent ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background' : '',
                  ].join(' ')}
                />
                <p className={[
                  'text-[10px] font-semibold text-center leading-tight whitespace-nowrap px-1',
                  isCurrent   ? 'text-primary' :
                  isCompleted ? 'text-foreground/60' :
                                'text-muted-foreground/40',
                ].join(' ')}>
                  {stage}
                </p>
              </div>

              {/* Connector line — not after last node */}
              {!isLast && (
                <div className={[
                  'h-0.5 flex-1 mt-1.5 mx-1 rounded-full',
                  isCompleted ? 'bg-primary/60' : 'bg-border/30',
                ].join(' ')} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
