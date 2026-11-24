/**
 * Utilities for exporting simulation telemetry as CSV and charts as PNG.
 */

export function buildSimulationCsv(history, params) {
  const headerMeta = [
    `# Double Pendulum Phase Space Simulation Export`,
    `# Parameters: m1=${params.m1} kg, m2=${params.m2} kg, L1=${params.L1} m, L2=${params.L2} m, g=${params.g} m/s^2`,
    `time_s,theta1_rad,theta2_rad,omega1_rad_s,omega2_rad_s,kinetic_J,potential_J,total_energy_J,x1_m,y1_m,x2_m,y2_m,angular_sep_rad,lyapunov_est_s_inv`,
  ];

  const rows = history.map((pt) =>
    [
      pt.t.toFixed(5),
      pt.theta1.toFixed(6),
      pt.theta2.toFixed(6),
      pt.omega1.toFixed(6),
      pt.omega2.toFixed(6),
      pt.kinetic.toFixed(6),
      pt.potential.toFixed(6),
      pt.total.toFixed(6),
      pt.x1.toFixed(5),
      pt.y1.toFixed(5),
      pt.x2.toFixed(5),
      pt.y2.toFixed(5),
      (pt.angularSeparation ?? 0).toExponential(5),
      (pt.lyapunov ?? 0).toFixed(5),
    ].join(',')
  );

  return [...headerMeta, ...rows].join('\n');
}

export function downloadCsvFile(csvContent, filename = 'double_pendulum_telemetry.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCanvasPng(canvasElement, filename = 'chart.png') {
  if (!canvasElement) return;
  // Composite onto dark background so transparent charts export cleanly
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvasElement.width;
  exportCanvas.height = canvasElement.height;
  const ctx = exportCanvas.getContext('2d');
  ctx.fillStyle = '#090d1a';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(canvasElement, 0, 0);

  const link = document.createElement('a');
  link.download = filename;
  link.href = exportCanvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
