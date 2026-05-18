interface HeatmapData {
  hour: number;
  day: string;
  value: number;
}

interface Props {
  data: HeatmapData[];
}

function getHeatColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio > 0.8) return '#dc2626'; // red
  if (ratio > 0.6) return '#ea580c'; // orange
  if (ratio > 0.4) return '#facc15'; // yellow
  if (ratio > 0.2) return '#84cc16'; // lime
  return '#14b8a6'; // teal
}

export default function ThreatHeatmap({ data }: Props) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxValue = Math.max(...data.map(d => d.value));

  const getValueForCell = (day: string, hour: number): number => {
    return data.find(d => d.day === day && d.hour === hour)?.value || 0;
  };

  const cellSize = 20;
  const topPadding = 30;

  return (
    <div className="overflow-x-auto">
      <div className="inline-block p-4">
        <div className="flex">
          {/* Y axis labels */}
          <div className="flex flex-col">
            <div style={{ height: topPadding }} />
            {days.map(day => (
              <div
                key={day}
                className="text-[10px] font-mono text-gray-500 flex items-center"
                style={{ height: cellSize }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="ml-2">
            {/* X axis labels */}
            <div className="flex gap-0">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="text-[8px] font-mono text-gray-500 text-center"
                  style={{ width: cellSize }}
                >
                  {String(hour).padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Grid */}
            {days.map(day => (
              <div key={day} className="flex gap-0">
                {hours.map(hour => {
                  const value = getValueForCell(day, hour);
                  const color = getHeatColor(value, maxValue);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="border border-gray-800/40 cursor-pointer hover:border-cyan-500/60 transition-all group relative"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: color,
                        opacity: value === 0 ? 0.2 : 0.8,
                      }}
                      title={`${day} ${String(hour).padStart(2, '0')}:00 - ${value} events`}
                    >
                      {value > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-teal-500" />
            <span className="text-gray-400">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-lime-500" />
            <span className="text-gray-400">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-400" />
            <span className="text-gray-400">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500" />
            <span className="text-gray-400">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-600" />
            <span className="text-gray-400">Severe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
