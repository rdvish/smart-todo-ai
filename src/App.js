import './App.css';
import Alert from 'react-bootstrap/Alert';
import Header from './MyComponents/Header';
import Footer from './MyComponents/Footer';
import Todos from './MyComponents/Todos';
import { AddTodo } from './MyComponents/AddTodo';
import { About } from './MyComponents/About';
import { AuthPage } from './MyComponents/AuthPage';
import { useAuth } from './AuthContext';
import { apiFetch } from './api';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';


const newId = () =>
  window.crypto && window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 3) | 8).toString(16);
      });

// Todos from localStorage. Old ones without an id get one.
function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem('todos') || '[]');
    return saved.map((t) => ({
      ...t,
      id: t.id || newId(),
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
      updatedAt: t.updatedAt || 0,
    }));
  } catch {
    return [];
  }
}

function getDeletedIds() {
  try {
    return JSON.parse(localStorage.getItem('deletedIds') || '[]');
  } catch {
    return [];
  }
}

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
}

function App() {
  const { user } = useAuth();

  // ---------- Todos (always stored locally) ----------
  const [todos, setTodos] = useState(loadLocal);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (title, desc, subtasks = []) => {
    setTodos([...todos, { id: newId(), title, desc, subtasks, completed: false, updatedAt: Date.now() }]);
  };

  const onDelete = (todo) => {
    setTodos(todos.filter((e) => e.id !== todo.id));
    // Remembering the delete so the next sync can remove it from the database too
    const ids = getDeletedIds();
    if (!ids.includes(todo.id)) {
      localStorage.setItem('deletedIds', JSON.stringify([...ids, todo.id]));
    }
  };

  const onComplete = (todo) => {
    if ((todo.subtasks || []).some((s) => !s.done)) return;
    setTodos(todos.map((e) => (e.id === todo.id ? { ...e, completed: true, updatedAt: Date.now() } : e)));
  };

  const onToggleSubtask = (todo, index) => {
    setTodos(
      todos.map((e) => {
        if (e.id !== todo.id) return e;
        const subtasks = (e.subtasks || []).map((s, i) =>
          i === index ? { ...s, done: !s.done } : s
        );
        return {
          ...e,
          subtasks,
          completed: subtasks.length > 0 && subtasks.every((s) => s.done),
          updatedAt: Date.now(),
        };
      })
    );
  };

  // ---------- Sync (logged-in users only) ----------
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState({ show: false, text: '', variant: 'success' });
  const showMsg = (text, variant = 'success') => setMsg({ show: true, text, variant });

  useEffect(() => {
    if (!msg.show) return;
    const t = setTimeout(() => setMsg((m) => ({ ...m, show: false })), 2500);
    return () => clearTimeout(t);
  }, [msg.show]);

  // Logged in: pull todos from the database and merge them into the local list.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch('/api/todos');
        if (cancelled) return;
        const pendingDeletes = new Set(getDeletedIds());
        setTodos((prev) => {
          const byId = new Map(prev.map((t) => [t.id, t]));
          let changed = false;
          
          for (const s of data.todos) {
            if (pendingDeletes.has(s.id)) continue;
            const local = byId.get(s.id);
            if (!local || s.updatedAt > (local.updatedAt || 0)) {
              byId.set(s.id, s);
              changed = true;
            }
          }

          
          for (const d of data.deleted || []) {
            const local = byId.get(d.id);
            if (local && d.deletedAt >= (local.updatedAt || 0)) {
              byId.delete(d.id);
              changed = true;
            }
          }

          return changed ? [...byId.values()] : prev;
        });
      } catch (err) {
        console.error('Could not load todos from the server', err);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const onSync = async () => {
    if (!user) {
      showMsg('Sync is available for logged in users only', 'warning');
      return;
    }
    if (syncing) return;
    setSyncing(true);
    try {
      const data = await apiFetch('/api/todos/sync', {
        method: 'POST',
        body: { todos, deleted: getDeletedIds() },
      });
      setTodos(data.todos);
      localStorage.removeItem('deletedIds');
      showMsg(`Synced ${data.todos.length} todo${data.todos.length === 1 ? '' : 's'}`);
    } catch (err) {
      console.error('Sync failed', err);
      showMsg(err.message || 'Sync failed', 'danger');
    } finally {
      setSyncing(false);
    }
  };

  // ---------- Theme ----------
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const id = setTimeout(() => {
      document.documentElement.classList.add('theme-ready');
    }, 100);
    return () => clearTimeout(id);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Alert
        variant={msg.variant}
        show={msg.show}
        transition
        className="py-2 shadow position-fixed top-0 end-0 m-3"
        style={{ zIndex: 1050 }}
      >
        {msg.text}
      </Alert>

      <div className="d-flex flex-column min-vh-100">
        <Header title="Smart Todo AI" searchBar={false} theme={theme} toggleTheme={toggleTheme} />
        <div className="flex-grow-1">
          <PageTransition>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <AddTodo addTodo={addTodo} />
                    <Todos
                      todos={todos}
                      onComplete={onComplete}
                      onDelete={onDelete}
                      onToggleSubtask={onToggleSubtask}
                      onSync={onSync}
                      syncing={syncing}
                    />
                  </>
                }
              />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </PageTransition>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;