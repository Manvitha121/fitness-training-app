import { useEffect, useMemo, useState } from 'react';

type Intensity = 'Low' | 'Medium' | 'High';

type Workout = {
  id: string;
  name: string;
  duration: number;
  calories: number;
  intensity: Intensity;
  date: string;
};

type DailyRecord = {
  date: string;
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  water: number;
  workouts: Workout[];
};

type Tab = 'dashboard' | 'workout' | 'history' | 'terms';

const STORAGE_KEY = 'fitflow-records';
const TERMS_KEY = 'fitflow-terms-accepted';

const sampleRecords: DailyRecord[] = [
  {
    date: '2026-09-20',
    steps: 8640,
    caloriesBurned: 340,
    activeMinutes: 54,
    water: 2.1,
    workouts: [
      { id: 'w1', name: 'Strength Training', duration: 38, calories: 220, intensity: 'High', date: '2026-09-20' },
      { id: 'w2', name: 'Cycling', duration: 22, calories: 120, intensity: 'Medium', date: '2026-09-20' },
    ],
  },
  {
    date: '2026-09-21',
    steps: 7120,
    caloriesBurned: 290,
    activeMinutes: 48,
    water: 1.8,
    workouts: [{ id: 'w3', name: 'HIIT', duration: 26, calories: 180, intensity: 'High', date: '2026-09-21' }],
  },
  {
    date: '2026-09-22',
    steps: 9200,
    caloriesBurned: 390,
    activeMinutes: 60,
    water: 2.3,
    workouts: [{ id: 'w4', name: 'Running', duration: 30, calories: 210, intensity: 'High', date: '2026-09-22' }],
  },
  {
    date: '2026-09-23',
    steps: 6500,
    caloriesBurned: 260,
    activeMinutes: 40,
    water: 1.7,
    workouts: [{ id: 'w5', name: 'Yoga', duration: 28, calories: 90, intensity: 'Low', date: '2026-09-23' }],
  },
  {
    date: '2026-09-24',
    steps: 10120,
    caloriesBurned: 430,
    activeMinutes: 68,
    water: 2.4,
    workouts: [{ id: 'w6', name: 'Cardio', duration: 45, calories: 260, intensity: 'High', date: '2026-09-24' }],
  },
  {
    date: '2026-09-25',
    steps: 7800,
    caloriesBurned: 310,
    activeMinutes: 46,
    water: 2.0,
    workouts: [{ id: 'w7', name: 'Pilates', duration: 32, calories: 120, intensity: 'Medium', date: '2026-09-25' }],
  },
  {
    date: '2026-09-26',
    steps: 0,
    caloriesBurned: 0,
    activeMinutes: 0,
    water: 0,
    workouts: [],
  },
];

const formatDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

const getToday = () => new Date().toISOString().slice(0, 10);

const getDefaultRecord = (date: string): DailyRecord => ({
  date,
  steps: 0,
  caloriesBurned: 0,
  activeMinutes: 0,
  water: 0,
  workouts: [],
});

const percentOf = (value: number, goal: number) => Math.min((value / goal) * 100, 100);

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [records, setRecords] = useState<DailyRecord[]>(() => {
    const savedRecords = localStorage.getItem(STORAGE_KEY);
    if (!savedRecords) return sampleRecords;
    try {
      return JSON.parse(savedRecords) as DailyRecord[];
    } catch {
      return sampleRecords;
    }
  });
  const [termsAccepted, setTermsAccepted] = useState<boolean>(() => {
    return localStorage.getItem(TERMS_KEY) === 'true';
  });
  const [steps, setSteps] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [activeMinutes, setActiveMinutes] = useState('');
  const [water, setWater] = useState('');
  const [workoutForm, setWorkoutForm] = useState({
    name: '',
    duration: '',
    calories: '',
    intensity: 'Medium' as Intensity,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(TERMS_KEY, termsAccepted ? 'true' : 'false');
  }, [termsAccepted]);

  const today = getToday();

  const todayRecord = useMemo(() => {
    const existing = records.find((r) => r.date === today);
    return existing ?? getDefaultRecord(today);
  }, [records, today]);

  useEffect(() => {
    if (!records.some((r) => r.date === today)) {
      setRecords((prev) => [getDefaultRecord(today), ...prev]);
    }
  }, [records, today]);

  const weeklyData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toISOString().slice(0, 10);
    });

    return dates.map((date) => {
      const record = records.find((item) => item.date === date) ?? getDefaultRecord(date);
      return {
        date: formatDateLabel(date),
        steps: record.steps,
      };
    });
  }, [records]);

  const workoutCount = todayRecord.workouts.length;
  const totalWorkoutCalories = todayRecord.workouts.reduce((sum, workout) => sum + workout.calories, 0);

  const updateTodayRecord = (updates: Partial<DailyRecord>) => {
    setRecords((prev) => {
      const index = prev.findIndex((record) => record.date === today);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...updates };
        return next;
      }
      const nextRecord = { ...getDefaultRecord(today), ...updates };
      return [nextRecord, ...prev];
    });
  };

  const handleActivitySave = () => {
    updateTodayRecord({
      steps: Number(steps) || 0,
      caloriesBurned: Number(caloriesBurned) || 0,
      activeMinutes: Number(activeMinutes) || 0,
      water: Number(water) || 0,
    });
    setSteps('');
    setCaloriesBurned('');
    setActiveMinutes('');
    setWater('');
  };

  const handleWorkoutSave = () => {
    if (!workoutForm.name.trim()) return;
    const newWorkout: Workout = {
      id: `${Date.now()}`,
      name: workoutForm.name.trim(),
      duration: Number(workoutForm.duration) || 0,
      calories: Number(workoutForm.calories) || 0,
      intensity: workoutForm.intensity,
      date: today,
    };

    setRecords((prev) => {
      const index = prev.findIndex((record) => record.date === today);
      if (index >= 0) {
        const next = [...prev];
        next[index] = {
          ...next[index],
          workouts: [...next[index].workouts, newWorkout],
        };
        return next;
      }
      const newRecord = { ...getDefaultRecord(today), workouts: [newWorkout] };
      return [newRecord, ...prev];
    });

    setWorkoutForm({ name: '', duration: '', calories: '', intensity: 'Medium' });
  };

  const deleteWorkout = (id: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.date === today
          ? { ...record, workouts: record.workouts.filter((workout) => workout.id !== id) }
          : record,
      ),
    );
  };

  return (
    <div className="app-shell">
      {!termsAccepted && (
        <div className="terms-overlay">
          <div className="terms-modal">
            <div className="logo-badge">FitFlow</div>
            <h2>Terms & Conditions</h2>
            <div className="terms-content">
              <p>Welcome to FitFlow. By using this app, you agree to use the platform responsibly and consult your healthcare professional before beginning a new fitness routine.</p>
              <p>FitFlow provides fitness tracking tools for personal wellness planning, not medical advice. We do not guarantee specific health outcomes or results.</p>
              <p>You are responsible for your safety, nutrition, and physical activity decisions. Please stop any exercise that causes pain or discomfort.</p>
              <p>We store your activity data locally in the browser for tracking and convenience. This app is intended for personal use only.</p>
            </div>
            <label className="agree-row">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              I agree to the Terms & Conditions
            </label>
          </div>
        </div>
      )}

      <header className="topbar">
        <div>
          <p className="eyebrow">Fitness companion</p>
          <h1>FitFlow</h1>
        </div>
        <button className="ghost-button" onClick={() => setTab('terms')}>
          Terms
        </button>
      </header>

      <nav className="tab-bar">
        <button className={tab === 'dashboard' ? 'tab active' : 'tab'} onClick={() => setTab('dashboard')}>
          Dashboard
        </button>
        <button className={tab === 'workout' ? 'tab active' : 'tab'} onClick={() => setTab('workout')}>
          Workout
        </button>
        <button className={tab === 'history' ? 'tab active' : 'tab'} onClick={() => setTab('history')}>
          History
        </button>
      </nav>

      {tab === 'dashboard' && (
        <main className="content-grid">
          <section className="panel hero-panel">
            <div>
              <p className="eyebrow">Today</p>
              <h2>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
            </div>
            <div className="hero-summary">
              <div className="summary-pill">
                <span>Goal progress</span>
                <strong>{Math.round(percentOf(todayRecord.steps, 8000))}%</strong>
              </div>
              <div className="summary-pill accent">
                <span>Workout streak</span>
                <strong>5 days</strong>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            <StatCard title="Steps" value={todayRecord.steps.toLocaleString()} goal="8,000" progress={percentOf(todayRecord.steps, 8000)} color="blue" />
            <StatCard title="Calories burned" value={`${todayRecord.caloriesBurned}`} goal="400" progress={percentOf(todayRecord.caloriesBurned, 400)} color="green" />
            <StatCard title="Active minutes" value={`${todayRecord.activeMinutes}`} goal="60" progress={percentOf(todayRecord.activeMinutes, 60)} color="orange" />
            <StatCard title="Water" value={`${todayRecord.water.toFixed(1)}L`} goal="2.5L" progress={percentOf(todayRecord.water, 2.5)} color="purple" />
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Daily activity</h3>
              <span>{workoutCount} workouts</span>
            </div>
            <div className="input-grid two-col">
              <label>
                <span>Steps</span>
                <input value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="e.g. 7500" />
              </label>
              <label>
                <span>Calories burned</span>
                <input value={caloriesBurned} onChange={(e) => setCaloriesBurned(e.target.value)} placeholder="e.g. 320" />
              </label>
              <label>
                <span>Active minutes</span>
                <input value={activeMinutes} onChange={(e) => setActiveMinutes(e.target.value)} placeholder="e.g. 45" />
              </label>
              <label>
                <span>Water (L)</span>
                <input value={water} onChange={(e) => setWater(e.target.value)} placeholder="e.g. 2.1" />
              </label>
            </div>
            <button className="primary-button" onClick={handleActivitySave}>Save activity</button>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Weekly progress</h3>
              <span>{weeklyData[weeklyData.length - 1]?.steps ?? 0} steps</span>
            </div>
            <div className="chart">
              {weeklyData.map((item) => {
                const barHeight = Math.max((item.steps / 12000) * 100, 8);
                return (
                  <div key={item.date} className="bar-group">
                    <div className="bar-column">
                      <div className="bar-fill" style={{ height: `${barHeight}%` }} />
                    </div>
                    <span>{item.date.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {tab === 'workout' && (
        <main className="content-grid narrow-grid">
          <section className="panel">
            <div className="panel-header">
              <h3>Add workout</h3>
              <span>{totalWorkoutCalories} kcal</span>
            </div>
            <div className="input-grid">
              <label>
                <span>Workout name</span>
                <input value={workoutForm.name} onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })} placeholder="e.g. Strength Session" />
              </label>
              <div className="split-inputs">
                <label>
                  <span>Duration (min)</span>
                  <input value={workoutForm.duration} onChange={(e) => setWorkoutForm({ ...workoutForm, duration: e.target.value })} placeholder="35" />
                </label>
                <label>
                  <span>Calories</span>
                  <input value={workoutForm.calories} onChange={(e) => setWorkoutForm({ ...workoutForm, calories: e.target.value })} placeholder="220" />
                </label>
              </div>
              <label>
                <span>Intensity</span>
                <select value={workoutForm.intensity} onChange={(e) => setWorkoutForm({ ...workoutForm, intensity: e.target.value as Intensity })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>
            </div>
            <button className="primary-button" onClick={handleWorkoutSave}>Add workout</button>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Workout list</h3>
              <span>{todayRecord.workouts.length} items</span>
            </div>
            <div className="workout-list">
              {todayRecord.workouts.length === 0 ? (
                <p className="empty-state">No workouts logged yet today.</p>
              ) : (
                todayRecord.workouts.map((workout) => (
                  <div key={workout.id} className="workout-item">
                    <div>
                      <strong>{workout.name}</strong>
                      <p>
                        {workout.duration} min • {workout.intensity}
                      </p>
                    </div>
                    <div className="workout-meta">
                      <span>{workout.calories} kcal</span>
                      <button onClick={() => deleteWorkout(workout.id)}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      )}

      {tab === 'history' && (
        <main className="content-grid">
          <section className="panel">
            <div className="panel-header">
              <h3>Past activity</h3>
              <span>{records.length} days</span>
            </div>
            <div className="history-list">
              {records
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((record) => (
                  <div key={record.date} className="history-item">
                    <div className="history-date">{formatDateLabel(record.date)}</div>
                    <div className="history-stats">
                      <span>{record.steps} steps</span>
                      <span>{record.activeMinutes} min</span>
                      <span>{record.caloriesBurned} kcal</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </main>
      )}

      {tab === 'terms' && (
        <main className="content-grid">
          <section className="panel terms-panel">
            <h3>Terms & Conditions</h3>
            <div className="terms-content">
              <p>Welcome to FitFlow, a personal fitness tracking application designed to help you monitor daily activity, exercise, calories, and wellness progress.</p>
              <p>By using this app, you acknowledge that fitness information is for general guidance only and is not a substitute for professional medical advice.</p>
              <p>You are responsible for your exercise choices, equipment safety, and health decisions. Please consult a medical professional before beginning intense training or changing your diet significantly.</p>
              <p>FitFlow stores your data locally for convenience and personal tracking. We do not guarantee outcome or performance results.</p>
            </div>
            <label className="agree-row">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              I agree to the Terms & Conditions
            </label>
          </section>
        </main>
      )}
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  goal: string;
  progress: number;
  color: 'blue' | 'green' | 'orange' | 'purple';
};

function StatCard({ title, value, goal, progress, color }: StatCardProps) {
  return (
    <div className="panel stat-card">
      <div className="stat-topline">
        <span>{title}</span>
        <span>{goal}</span>
      </div>
      <div className="ring-wrap">
        <div
          className={`progress-ring ${color}`}
          style={{
            background: `conic-gradient(var(--${color}) ${progress * 3.6}deg, rgba(255,255,255,0.12) 0deg)`,
          }}
        >
          <div className="ring-inner">
            <strong>{value}</strong>
          </div>
        </div>
      </div>
      <div className="small-progress">
        <div className="small-progress-bar">
          <span style={{ width: `${(progress > 100 ? 100 : progress)}%` }} />
        </div>
      </div>
    </div>
  );
}

export default App;
