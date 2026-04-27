import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  const fetchTimer = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/time-entries/timer/active');
      setActiveTimer(data);
    } catch {
      setActiveTimer(null);
    }
  }, [user]);

  useEffect(() => { fetchTimer(); }, [fetchTimer]);

  useEffect(() => {
    if (activeTimer && !activeTimer.paused_at) {
      intervalRef.current = setInterval(() => {
        const started = new Date(activeTimer.started_at);
        const paused = activeTimer.paused_duration_minutes * 60;
        const secs = Math.floor((Date.now() - started) / 1000) - paused;
        setElapsed(Math.max(0, secs));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      if (activeTimer?.paused_at) {
        const started = new Date(activeTimer.started_at);
        const paused = activeTimer.paused_duration_minutes * 60;
        setElapsed(Math.max(0, Math.floor((new Date(activeTimer.paused_at) - started) / 1000) - paused));
      } else {
        setElapsed(0);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [activeTimer]);

  const startTimer = async (project_id, task_id, description) => {
    const { data } = await api.post('/time-entries/timer/start', { project_id, task_id, description });
    setActiveTimer(data);
  };

  const stopTimer = async (extra = {}) => {
    const { data } = await api.post('/time-entries/timer/stop', extra);
    setActiveTimer(null);
    setElapsed(0);
    return data;
  };

  const pauseTimer = async () => {
    await api.post('/time-entries/timer/pause');
    await fetchTimer();
  };

  const resumeTimer = async () => {
    await api.post('/time-entries/timer/resume');
    await fetchTimer();
  };

  const discardTimer = async () => {
    await api.delete('/time-entries/timer/active');
    setActiveTimer(null);
    setElapsed(0);
  };

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <TimerContext.Provider value={{ activeTimer, elapsed, formatElapsed, startTimer, stopTimer, pauseTimer, resumeTimer, discardTimer, fetchTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
