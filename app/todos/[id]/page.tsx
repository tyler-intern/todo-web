'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  description: string;
  notes: string;
  due_date: string;
  created_at: string;
}

export default function TodoDetails() {
  const { id } = useParams();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/todos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTodo(data);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!todo) return;
    setSaving(true);

    // FIX: Format the date string so the Go API doesn't get mad
    const formattedDate = todo.due_date 
      ? new Date(todo.due_date).toISOString() 
      : null;

    try {
      const res = await fetch(`http://localhost:3001/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: todo.title,
          description: todo.description,
          notes: todo.notes,
          due_date: formattedDate, // Use the fixed date here
          completed: todo.completed
        }),
      });

      if (res.ok) {
        alert('Saved successfully!');
      } else {
        const errorData = await res.json();
        console.error("Server Error:", errorData);
        alert("Error saving: " + (errorData.error || "Check console"));
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };
// Handles loading the todo details, i never see this part though because it loads too fast.
  if (loading) return <p style={{ padding: '70px' }}>Loading...</p>;
  if (!todo) return <p style={{ padding: '70px' }}>Task not found.</p>;

  return (
    <div style={{ padding: '70px', fontFamily: 'sans-serif'}}>
      
      <h1 style={{ margin: '20px 0px', fontWeight: 'bold', fontSize: '24px', textAlign: 'center' }}>{todo.title}</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold' }}>Description</label>
        <textarea 
          style={{ width: '1200px', height: '200px', padding: '8px', marginTop: '5px', border: '1px solid black' }}
          value={todo.description || ''} 
          onChange={(e) => setTodo({...todo, description: e.target.value})}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold' }}>Notes</label>
        <textarea 
          style={{ width: '1200px', height: '200px', padding: '8px', marginTop: '5px', border: '1px solid black' }}
          value={todo.notes || ''} 
          onChange={(e) => setTodo({...todo, notes: e.target.value})}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 'bold' }}>Due Date</label>
        <input 
          type="datetime-local"
          style={{ padding: '8px', marginTop: '5px', border: '1px solid black' }}
          value={todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : ''}
          onChange={(e) => setTodo({...todo, due_date: e.target.value})}
        />
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
      <div style={{ marginTop: '20px' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#0070f3' }}>← Back to List</Link>
      </div>
    </div>
  );
}