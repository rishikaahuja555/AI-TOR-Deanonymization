import { useEffect, useRef } from 'react';

interface DataPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface Props {
  data: DataPoint[];
}

export default function ThreatLineChart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data.flatMap(d => [d.critical, d.high, d.medium, d.low]));
    const xStep = innerWidth / (data.length - 1 || 1);
    const yScale = innerHeight / maxValue;

    const svg = svgRef.current;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Clear
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (innerHeight / 4) * i;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(padding.left));
      line.setAttribute('y1', String(y));
      line.setAttribute('x2', String(width - padding.right));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', 'rgba(107, 114, 128, 0.2)');
      line.setAttribute('stroke-dasharray', '4');
      svg.appendChild(line);
    }

    // Lines
    const colors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    const keys: (keyof typeof colors)[] = ['critical', 'high', 'medium', 'low'];

    keys.forEach(key => {
      const points = data.map((d, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + innerHeight - d[key] * yScale;
        return `${x},${y}`;
      });

      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', points.join(' '));
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('stroke', colors[key]);
      polyline.setAttribute('stroke-width', '2');
      polyline.setAttribute('stroke-linecap', 'round');
      polyline.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(polyline);

      // Data points
      data.forEach((d, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + innerHeight - d[key] * yScale;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(x));
        circle.setAttribute('cy', String(y));
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', colors[key]);
        circle.setAttribute('opacity', '0.6');
        svg.appendChild(circle);
      });
    });

    // X-axis labels
    data.forEach((d, i) => {
      const x = padding.left + i * xStep;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(height - 10));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#9ca3af');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-family', 'monospace');
      text.textContent = d.date;
      svg.appendChild(text);
    });

    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * i);
      const y = padding.top + innerHeight - (innerHeight / 4) * i;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(padding.left - 10));
      text.setAttribute('y', String(y + 4));
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('fill', '#9ca3af');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-family', 'monospace');
      text.textContent = String(value);
      svg.appendChild(text);
    }

    // Legend
    const legendY = 20;
    const legendItems = Object.entries(colors);
    legendItems.forEach(([label, color], idx) => {
      const x = width - 150 - idx * 110;
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(legendY));
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', color);
      svg.appendChild(dot);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(x + 10));
      text.setAttribute('y', String(legendY + 4));
      text.setAttribute('fill', '#d1d5db');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'monospace');
      text.textContent = label.toUpperCase();
      svg.appendChild(text);
    });
  }, [data]);

  return <svg ref={svgRef} className="w-full" />;
}
