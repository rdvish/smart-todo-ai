import React,{useState} from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';


export const AddTodo = ({addTodo}) => {
  const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false); // 1. Added loading state

    // 2. Moved inside the component so it can use setDesc and setLoading
  const generateAISubtasks = async () => {
    if (!title) {
      alert("Please enter a todo title first!");
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
        // Automatically adds a new todo item to your list with the AI subtasks
        addTodo(title, data.subtasks);
        setTitle("");
        setDesc("");
      }
    } catch (err) {
      console.error('API call failed:', err);
      alert("Could not connect to AI server. Make sure your Express backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if(!title || !desc){
        alert("Title or Description cannot be blank");
    } else {
        addTodo(title, desc);
        setTitle("");
        setDesc("");
    }
  }

  return (
    <div className="container my-3">
        <h3>Add a Todo</h3>
    <form onSubmit={submit}>
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-control" id="title" placeholder="Enter todo title" disabled={loading}/>
      </div>
      <div className="form-group  my-3">
        <label htmlFor="desc">Description</label>
        <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="form-control" id="desc" placeholder="Enter todo description" disabled={loading}/>
      </div>
      <button 
          type="button" 
          className="btn btn-secondary me-2" 
          onClick={generateAISubtasks}
          disabled={loading}
        >
          {loading ? "Thinking..." : "✨ Generate AI Subtasks"}
        </button>
      <button type="submit" className="btn btn-sm btn-success" disabled={loading}>Add Todo</button>
    </form></div>
  );
}