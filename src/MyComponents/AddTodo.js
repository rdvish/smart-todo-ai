import React, { useState, useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const AddTodo = ({ addTodo }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", variant: "success" });

  const showMsg = (message, variant = "success") =>
    setAlertInfo({ show: true, message, variant });

  // auto-hide after 2 seconds
  useEffect(() => {
    if (!alertInfo.show) return;
    const timer = setTimeout(() => setAlertInfo(a => ({ ...a, show: false })), 2000);
    return () => clearTimeout(timer);
  }, [alertInfo.show]);

  const generateAISubtasks = async () => {
    if (!title) {
      showMsg("Please enter a todo title first!", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/suggest-subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc }),
      });
      const data = await res.json();

      if (data.success) {
        // Accept an array, or a string like "1. a, 2. b" / "a\nb"
        const list = Array.isArray(data.subtasks)
          ? data.subtasks
          : String(data.subtasks)
              .split(/,|\n/)
              .map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim())
              .filter(Boolean);

        const subtasks = list.map(text => ({ text, done: false }));

        addTodo(title, desc, subtasks);   // note the third argument
        setTitle("");
        setDesc("");
        showMsg("Todo added successfully!");
      } else {
        showMsg("AI couldn't generate subtasks. Try again.", "danger");
      }
    } catch (err) {
      console.error('API call failed:', err);
      showMsg("Could not connect to AI server", "danger");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title || !desc) {
      showMsg("Title or Description cannot be blank", "warning");
    } else {
      addTodo(title, desc);
      setTitle("");
      setDesc("");
      showMsg("Todo added successfully!");
    }
  };

  return (
    <div className="app-container pb-0">
      <Alert
        variant={alertInfo.variant}
        show={alertInfo.show}
        transition
        className="py-2 shadow position-fixed top-0 end-0 m-3"
        style={{ zIndex: 1050 }}
      >
        {alertInfo.message}
      </Alert>

      <form onSubmit={submit} className="app-card">
        <h4 className="fw-bold mb-3">Add a Todo</h4>

        <div className="mb-3">
          <label htmlFor="title" className="app-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control app-input"
            id="title"
            placeholder="What needs to be done?"
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="desc" className="app-label">Description</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="form-control app-input"
            id="desc"
            placeholder="Add some details"
            disabled={loading}
          />
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button type="submit" className="app-btn" disabled={loading}>
            Add Todo
          </button>
          <button
            type="button"
            className="app-btn app-btn-ghost"
            onClick={generateAISubtasks}
            disabled={loading}
          >
            {loading ? "Thinking..." : "✨ Generate AI Subtasks"}
          </button>
        </div>
      </form>
    </div>
  );
};