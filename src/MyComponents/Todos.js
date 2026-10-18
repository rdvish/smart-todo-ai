import React, { useState } from 'react';
import Todo from './Todo';

const FILTERS = ['All', 'Active', 'Done'];

function Todos(props) {
  const [filter, setFilter] = useState('All');

  const total = props.todos.length;
  const doneCount = props.todos.filter(t => t.completed).length;

  const visible = props.todos.filter(t =>
    filter === 'All' ? true : filter === 'Done' ? t.completed : !t.completed
  );

  return (
    <div className="app-container pt-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 className="fw-bold mb-0">Your todos</h4>
          <small className="text-secondary">{doneCount} of {total} done</small>
        </div>
        <div className="d-flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state app-card">
          {total === 0 ? "No todos yet. Add your first one above." : `Nothing in "${filter}".`}
        </div>
      ) : (
        visible.map(todo => (
          <Todo
            key={todo.sno}
            todo={todo}
            onComplete={props.onComplete}
            onDelete={props.onDelete}
            onToggleSubtask={props.onToggleSubtask}
          />
        ))
      )}
    </div>
  );
}

export default Todos;