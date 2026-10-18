import React from 'react';

function Todo({ todo, onComplete, onDelete, onToggleSubtask }) {
  const done = todo.completed;
  const subtasks = Array.isArray(todo.subtasks) ? todo.subtasks : [];
  const doneCount = subtasks.filter(s => s.done).length;
  const canComplete = subtasks.length === 0 || doneCount === subtasks.length;

  return (
    <div className={`app-card todo-card ${done ? 'is-done' : ''}`}>
      <button
        type="button"
        className="todo-check"
        aria-label={done ? "Completed" : "Mark as complete"}
        title={!done && !canComplete ? "Finish all subtasks first" : ""}
        disabled={done || !canComplete}
        onClick={() => onComplete(todo)}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="todo-body">
        <h5 className="todo-title">{todo.title}</h5>
        {todo.desc && <p className="todo-desc">{todo.desc}</p>}

        {subtasks.length > 0 && (
          <div className="subtasks">
            <div className="subtasks-head">
              <span>✨ AI subtasks</span>
              <span>{doneCount}/{subtasks.length}</span>
            </div>
            <div className="subtasks-bar">
              <div
                className="subtasks-bar-fill"
                style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
              />
            </div>
            {subtasks.map((s, i) => (
              <label key={i} className={`subtask ${s.done ? 'is-done' : ''}`}>
                <input
                  type="checkbox"
                  checked={s.done}
                  disabled={!onToggleSubtask}
                  onChange={() => onToggleSubtask && onToggleSubtask(todo, i)}
                />
                <span>{s.text}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="todo-delete"
        aria-label="Delete todo"
        onClick={() => onDelete(todo)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}

export default Todo;