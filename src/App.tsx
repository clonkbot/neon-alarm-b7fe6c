import { useState, useEffect, useCallback } from 'react'

interface Alarm {
  id: string
  time: string
  label: string
  enabled: boolean
  days: number[]
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const saved = localStorage.getItem('neon-alarms')
    return saved ? JSON.parse(saved) : []
  })
  const [showAddAlarm, setShowAddAlarm] = useState(false)
  const [newAlarmTime, setNewAlarmTime] = useState('07:00')
  const [newAlarmLabel, setNewAlarmLabel] = useState('')
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null)
  const [snoozedAlarms, setSnoozedAlarms] = useState<Map<string, number>>(new Map())

  // Save alarms to localStorage
  useEffect(() => {
    localStorage.setItem('neon-alarms', JSON.stringify(alarms))
  }, [alarms])

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Check alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date()
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTimeStr && now.getSeconds() === 0) {
          const snoozeEnd = snoozedAlarms.get(alarm.id)
          if (!snoozeEnd || Date.now() > snoozeEnd) {
            setActiveAlarm(alarm)
          }
        }
      })
    }
    
    const interval = setInterval(checkAlarms, 1000)
    return () => clearInterval(interval)
  }, [alarms, snoozedAlarms])

  const addAlarm = useCallback(() => {
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: newAlarmTime,
      label: newAlarmLabel || 'Alarm',
      enabled: true,
      days: []
    }
    setAlarms(prev => [...prev, newAlarm])
    setShowAddAlarm(false)
    setNewAlarmTime('07:00')
    setNewAlarmLabel('')
  }, [newAlarmTime, newAlarmLabel])

  const toggleAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.map(alarm => 
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    ))
  }, [])

  const deleteAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== id))
  }, [])

  const dismissAlarm = useCallback(() => {
    setActiveAlarm(null)
  }, [])

  const snoozeAlarm = useCallback(() => {
    if (activeAlarm) {
      const snoozeEnd = Date.now() + 5 * 60 * 1000 // 5 minutes
      setSnoozedAlarms(prev => new Map(prev).set(activeAlarm.id, snoozeEnd))
      setActiveAlarm(null)
    }
  }, [activeAlarm])

  const getNextAlarm = useCallback(() => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    const enabledAlarms = alarms.filter(a => a.enabled)
    if (enabledAlarms.length === 0) return null
    
    let closest: Alarm | null = null
    let closestDiff = Infinity
    
    enabledAlarms.forEach(alarm => {
      const [hours, minutes] = alarm.time.split(':').map(Number)
      let alarmMinutes = hours * 60 + minutes
      
      let diff = alarmMinutes - currentMinutes
      if (diff <= 0) diff += 24 * 60 // Next day
      
      if (diff < closestDiff) {
        closestDiff = diff
        closest = alarm
      }
    })
    
    return closest ? { alarm: closest, minutesUntil: closestDiff } : null
  }, [alarms])

  const formatTimeUntil = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

  const hours = String(currentTime.getHours()).padStart(2, '0')
  const minutes = String(currentTime.getMinutes()).padStart(2, '0')
  const seconds = String(currentTime.getSeconds()).padStart(2, '0')
  const nextAlarm = getNextAlarm()

  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-bg relative overflow-hidden flex flex-col">
      {/* Scan line effect */}
      <div className="scan-line" />
      
      {/* Ambient glow orbs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-[#ff2d95] rounded-full opacity-10 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-[#00f5ff] rounded-full opacity-10 blur-[100px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b026ff] rounded-full opacity-5 blur-[150px] pointer-events-none" />

      <div className="flex-1 relative z-10 p-4 md:p-8 flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center mb-8 animate-float">
          <h1 className="font-orbitron text-xl md:text-2xl tracking-[0.3em] text-[#00f5ff] neon-glow-cyan mb-2">
            NEON ALARM
          </h1>
          <div className="h-[1px] w-32 mx-auto bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent" />
        </div>

        {/* Main Clock Display */}
        <div className="glass neon-border rounded-3xl p-8 md:p-12 mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff2d95]/5 to-[#00f5ff]/5 rounded-3xl" />
          
          <div className="relative flex items-center justify-center gap-2 md:gap-4">
            {/* Hours */}
            <div className="flex gap-1 md:gap-2">
              {hours.split('').map((digit, i) => (
                <div 
                  key={`h-${i}`}
                  className="font-orbitron text-6xl md:text-8xl lg:text-9xl font-bold text-[#ff2d95] neon-glow-pink digit-flip"
                >
                  {digit}
                </div>
              ))}
            </div>
            
            {/* Separator */}
            <div className="flex flex-col gap-3 mx-2">
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#00f5ff] ${Number(seconds) % 2 === 0 ? 'opacity-100' : 'opacity-30'} transition-opacity duration-200`} 
                   style={{ boxShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff' }} />
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#00f5ff] ${Number(seconds) % 2 === 0 ? 'opacity-100' : 'opacity-30'} transition-opacity duration-200`}
                   style={{ boxShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff' }} />
            </div>
            
            {/* Minutes */}
            <div className="flex gap-1 md:gap-2">
              {minutes.split('').map((digit, i) => (
                <div 
                  key={`m-${i}`}
                  className="font-orbitron text-6xl md:text-8xl lg:text-9xl font-bold text-[#00f5ff] neon-glow-cyan digit-flip"
                >
                  {digit}
                </div>
              ))}
            </div>
            
            {/* Seconds */}
            <div className="flex gap-1 ml-2 md:ml-4 self-end mb-2 md:mb-4">
              {seconds.split('').map((digit, i) => (
                <div 
                  key={`s-${i}`}
                  className="font-orbitron text-2xl md:text-3xl font-medium text-[#b026ff] opacity-70"
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>

          {/* Next alarm indicator */}
          {nextAlarm && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#b026ff]/30">
                <div className="w-2 h-2 rounded-full bg-[#b026ff] animate-pulse" />
                <span className="font-rajdhani text-sm text-[#b026ff]">
                  Next: {nextAlarm.alarm.label} in {formatTimeUntil(nextAlarm.minutesUntil)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alarms Section */}
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-orbitron text-lg tracking-wider text-white/80">ALARMS</h2>
            <button
              onClick={() => setShowAddAlarm(true)}
              className="glass neon-border rounded-full px-6 py-2 font-rajdhani text-[#00f5ff] hover:bg-[#00f5ff]/10 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ADD
            </button>
          </div>

          {/* Alarm List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {alarms.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-white/5">
                <div className="text-4xl mb-3">⏰</div>
                <p className="text-white/40 font-rajdhani">No alarms set</p>
                <p className="text-white/20 text-sm font-rajdhani">Tap + to create one</p>
              </div>
            ) : (
              alarms.map((alarm, index) => (
                <div
                  key={alarm.id}
                  className={`glass rounded-2xl p-4 border transition-all duration-500 ${
                    alarm.enabled 
                      ? 'border-[#00f5ff]/30 hover:border-[#00f5ff]/50' 
                      : 'border-white/5 opacity-50'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-orbitron text-3xl text-white">
                        {alarm.time}
                      </div>
                      <div>
                        <div className="font-rajdhani text-white/80">{alarm.label}</div>
                        <div className="font-rajdhani text-xs text-white/40">Every day</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleAlarm(alarm.id)}
                        className={`w-14 h-7 rounded-full relative transition-all duration-300 ${
                          alarm.enabled 
                            ? 'bg-[#00f5ff]/20 border border-[#00f5ff]' 
                            : 'bg-white/5 border border-white/20'
                        }`}
                      >
                        <div 
                          className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 ${
                            alarm.enabled 
                              ? 'left-8 bg-[#00f5ff]' 
                              : 'left-1 bg-white/40'
                          }`}
                          style={alarm.enabled ? { boxShadow: '0 0 10px #00f5ff' } : {}}
                        />
                      </button>
                      
                      {/* Delete */}
                      <button
                        onClick={() => deleteAlarm(alarm.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff2d95]/60 hover:text-[#ff2d95] hover:bg-[#ff2d95]/10 transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Alarm Modal */}
      {showAddAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddAlarm(false)}
          />
          <div className="relative glass rounded-3xl p-8 w-full max-w-md neon-border animate-float" style={{ animationDuration: '3s' }}>
            <h3 className="font-orbitron text-xl text-[#00f5ff] neon-glow-cyan mb-6 text-center">NEW ALARM</h3>
            
            <div className="space-y-6">
              {/* Time Picker */}
              <div className="text-center">
                <input
                  type="time"
                  value={newAlarmTime}
                  onChange={(e) => setNewAlarmTime(e.target.value)}
                  className="font-orbitron text-5xl bg-transparent text-white text-center w-full outline-none focus:text-[#00f5ff] transition-colors duration-300"
                />
              </div>
              
              {/* Label Input */}
              <div>
                <label className="font-rajdhani text-white/60 text-sm block mb-2">LABEL</label>
                <input
                  type="text"
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  placeholder="Wake up, Meeting..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-rajdhani text-white placeholder-white/30 outline-none focus:border-[#00f5ff]/50 transition-colors duration-300"
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddAlarm(false)}
                  className="flex-1 py-3 rounded-xl font-rajdhani font-semibold text-white/60 border border-white/10 hover:border-white/30 transition-all duration-300"
                >
                  CANCEL
                </button>
                <button
                  onClick={addAlarm}
                  className="flex-1 py-3 rounded-xl font-rajdhani font-semibold text-[#0a0a0f] bg-[#00f5ff] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all duration-300"
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Alarm Modal */}
      {activeAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          
          {/* Pulsing rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] rounded-full border-2 border-[#ff2d95] opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-[300px] h-[300px] rounded-full border-2 border-[#00f5ff] opacity-30 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute w-[200px] h-[200px] rounded-full border-2 border-[#b026ff] opacity-40 animate-ping" style={{ animationDuration: '1s' }} />
          </div>
          
          <div className="relative glass rounded-3xl p-8 md:p-12 w-full max-w-md alarm-active-border text-center alarm-ring">
            <div className="text-6xl mb-4">⏰</div>
            <div className="font-orbitron text-6xl md:text-7xl text-[#ff2d95] neon-glow-pink mb-4">
              {activeAlarm.time}
            </div>
            <div className="font-rajdhani text-2xl text-white mb-8">{activeAlarm.label}</div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={snoozeAlarm}
                className="flex-1 py-4 rounded-xl font-rajdhani font-bold text-lg text-[#b026ff] border-2 border-[#b026ff] hover:bg-[#b026ff]/10 transition-all duration-300"
              >
                SNOOZE 5 MIN
              </button>
              <button
                onClick={dismissAlarm}
                className="flex-1 py-4 rounded-xl font-rajdhani font-bold text-lg text-[#0a0a0f] bg-gradient-to-r from-[#ff2d95] to-[#00f5ff] hover:shadow-[0_0_40px_rgba(255,45,149,0.5)] transition-all duration-300"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center">
        <p className="font-rajdhani text-xs text-white/20 tracking-wider">
          Requested by <span className="text-white/30">@0xPaulius</span> · Built by <span className="text-white/30">@clonkbot</span>
        </p>
      </footer>
    </div>
  )
}

export default App