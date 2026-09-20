import gsap from 'gsap'

export const chapters = [
  { name: 'The complete system', label: '01 / THE CHAMPIONSCLUB EXPERIENCE', title: ['PRECISION', 'IN MOTION.'], note: 'Human ambition. Mechanical precision.' },
  { name: 'Designed to move', label: '02 / THE EXTERIOR', title: ['DESIGNED', 'TO MOVE.'], note: 'Every perspective reveals a shared purpose.' },
  { name: 'Beneath the surface', label: '03 / BENEATH THE SURFACE', title: ['BEYOND', 'THE SURFACE.'], note: 'Look closer. Performance is a connected machine.' },
  { name: 'Into the engine', label: '04 / THE SOURCE OF MOTION', title: ['POWER,', 'REVEALED.'], note: 'An opening into the heart of the system.' },
  { name: 'The engine', label: '05 / THE ENGINEERING STUDY', title: ['THE MECHANICAL', 'HEART.'], note: 'Every result begins with the work inside.' },
  { name: 'Mechanical harmony', label: '06 / MECHANICAL HARMONY', title: ['ENGINEERED', 'TO PERFORM.'], note: 'Individual systems. Precisely connected.' },
  { name: 'Individual contribution', label: '07 / THE PEOPLE BEHIND THE POWER', title: ['INDIVIDUAL DRIVE.', 'COLLECTIVE FORCE.'], note: 'Every advisor contributes to the motion.' },
  { name: 'Team output', label: '08 / TEAM PERFORMANCE', title: ['PERFORMANCE,', 'REIMAGINED.'], note: 'Contribution becomes coordinated output.' },
  { name: 'The road ahead', label: '09 / FORECASTING', title: ['READ THE ROAD.', 'SHAPE WHAT’S NEXT.'], note: 'Actual performance. A projected finish. A shared target.' },
  { name: 'Champions Intelligence', label: '10 / CHAMPIONS INTELLIGENCE', title: ['SIGNAL', 'INTO DIRECTION.'], note: 'The control system behind your next move.' },
  { name: 'Recognition', label: '11 / RECOGNITION, REFINED', title: ['PROGRESS', 'HAS ITS REWARDS.'], note: 'Bronze. Silver. Gold. Recognition earned through contribution.' },
  { name: 'One machine', label: '12 / BACK IN SYNC', title: ['EVERYTHING', 'COMES TOGETHER.'], note: 'People. Strategy. Intelligence. One connected system.' },
  { name: 'Forward, together', label: '13 / CHAMPIONSCLUB', title: ['FORWARD.', 'TOGETHER.'], note: 'Turn performance into progress.' }
]

const poses = [
  [-4.8, 2.30, 6.0, 0, 1.20, 0, .12, 0, 0, 0, 0],
  [-3.8, 2.0, 8.8, 0, .9, 0, -.16, 0, 0, 0, 0],
  [-5.3, 4.0, 7.4, 0, 1.15, 0, -.18, 1, 0, 0, 0],
  [-3.6, 2.9, 4.9, -.65, 1.0, 0, -.30, 1.35, .48, 0, .48],
  [-3.7, 2.7, 5.6, 0, .6, 0, -.18, 1.8, 1, 0, 1],
  [-5.3, 3.4, 8.4, 0, 1.40, 0, .10, 1.8, 1, 1, 1],
  [-3.8, 3.1, 6.9, -.12, 1.9, 0, .12, 1.8, 1, 1.12, 1],
  [-4.2, 1.85, 7.7, 0, 1.08, 0, -.15, 1.8, 1, .85, 1],
  [-3.3, 2.7, 7.1, 0, .75, 0, -.28, 1.8, 1, 1, 1],
  [-4.6, 3.0, 7.8, .6, 1.35, 0, -.35, 1.8, 1, .72, 1],
  [-3.6, 2.7, 5.9, 0, .80, 0, -.05, 1.8, 1, .85, 1],
  [-5.6, 3.2, 7.6, 0, 1.0, 0, -.12, .82, .18, .18, .18],
  [-5.1, 2.1, 6.5, 0, 1.20, 0, .13, 0, 0, 0, 0]
]

const channels = ['cameraX', 'cameraY', 'cameraZ', 'targetX', 'targetY', 'targetZ', 'yaw', 'vehicleSpread', 'engineFocus', 'engineSpread', 'darkness']

export function createTimeline() {
  const state = Object.fromEntries(channels.map((channel, index) => [channel, poses[0][index]]))
  const timeline = gsap.timeline({ paused: true })
  poses.slice(1).forEach((pose, index) => {
    timeline.to(state, { ...Object.fromEntries(channels.map((channel, channelIndex) => [channel, pose[channelIndex]])), duration: 1, ease: 'sine.inOut' }, index)
  })
  return { state, seek(progress) { timeline.progress(progress) }, destroy() { timeline.kill() } }
}

export function smoothRange(value, start, end) {
  const amount = Math.max(0, Math.min(1, (value - start) / (end - start)))
  return amount * amount * (3 - 2 * amount)
}
