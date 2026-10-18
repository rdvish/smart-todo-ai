import './App.css';
import Header from './MyComponents/Header';
import Footer from './MyComponents/Footer';
import Todos from './MyComponents/Todos';
import { AddTodo } from './MyComponents/AddTodo';
import { About } from './MyComponents/About';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

function PageTransition({ children }) {
  const location = useLocation();
  // The key changes on every navigation, so React remounts the wrapper
  // and the CSS animation plays again.
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
}

function App() {
  // ---------- Todos ----------
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem("todos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // One place that saves todos, so the handlers below don't need to
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (title, desc, subtasks = []) => {
    const sno = todos.length === 0 ? 1 : todos[todos.length - 1].sno + 1;
    const myTodo = { sno, title, desc, subtasks };
    setTodos([...todos, myTodo]);
  };

  const onDelete = (todo) => {
    setTodos(todos.filter((e) => e.sno !== todo.sno));
  };

  const onComplete = (todo) => {
    // Safety net: don't complete a todo that still has open subtasks
    const hasOpenSubtasks = (todo.subtasks || []).some((s) => !s.done);
    if (hasOpenSubtasks) return;

    setTodos(
      todos.map((e) =>
        e.sno === todo.sno ? { ...e, completed: true } : e
      )
    );
  };

  const onToggleSubtask = (todo, index) => {
    setTodos(
      todos.map((e) => {
        if (e.sno !== todo.sno) return e;
        const subtasks = (e.subtasks || []).map((s, i) =>
          i === index ? { ...s, done: !s.done } : s
        );
        // Completed exactly when every subtask is done
        const allDone = subtasks.length > 0 && subtasks.every((s) => s.done);
        return { ...e, subtasks, completed: allDone };
      })
    );
  };

  // ---------- Theme ----------
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
  const id = setTimeout(() => {
    document.documentElement.classList.add("theme-ready");
  }, 100);
  return () => clearTimeout(id);
}, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <Router basename={process.env.PUBLIC_URL}>
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
                  />
                </>
              }
            />
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