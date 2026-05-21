'use client'; 

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  hierarchy: number;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', due_date: '' });

  useEffect(() => {
    fetch('http://localhost:3001/todos')
      .then((res) => res.json())
      .then((data) => {
        setTodos(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setLoading(false);
      });
  }, []);

// Handles adding a new todo
  const addTodo = async () => {
    if (!newTodo.title.trim()) return;
    const formattedDate = newTodo.due_date ? new Date(newTodo.due_date).toISOString() : null;

    try {
      const res = await fetch('http://localhost:3001/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTodo.title, 
          description: newTodo.description || null,
          due_date: formattedDate
        }),
      });

      if (res.ok) {
        const newlyCreated = await res.json();
        setTodos([...todos, newlyCreated]);
        setNewTodo({ title: '', description: '', due_date: '' });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to add todo:", err);
    }
  };
// Handles toggling the completed status of a todo
  const toggleTodo = async (id: string, completed: boolean) => {
    const res = await fetch(`http://localhost:3001/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    }
  };
  // Handles editing the title of a todo
  const editTodo = async (id: string, title: string) => {
    const res = await fetch(`http://localhost:3001/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }); 
    if (res.ok) {
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    }
  };
// Handles deleting a todo
  const deleteTodo = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}?"`)) return;
    const res = await fetch(`http://localhost:3001/todos/${id}`, { method: 'DELETE' });
    if (res.ok) setTodos(todos.filter(t => t.id !== id));
  };
  
// Handles dragging and dropping todos
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Handles moving between columns, in progress <-> completed
    if (source.droppableId !== destination.droppableId) {
        const isNowCompleted = destination.droppableId === 'completed-list';
        await toggleTodo(draggableId, isNowCompleted);
        return;
    }

    // Handles reordering within the same column
    const filteredItems = todos.filter(t => 
        source.droppableId === 'active-list' ? !t.completed : t.completed
    );
    
    const reordered = Array.from(filteredItems);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Merge reordered items back into master list
    const otherItems = todos.filter(t => 
        source.droppableId === 'active-list' ? t.completed : !t.completed
    );
    const newMasterList = [...reordered, ...otherItems];
    
    setTodos(newMasterList);

    try {
      await fetch('http://localhost:3001/todos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: newMasterList.map(t => t.id) }),
      });
    } catch (err) {
      console.error("Reorder Error:", err);
    }
  };

  const TodoItemRow = ({ todo, index }: { todo: Todo, index: number }) => (
    <Draggable key={todo.id} draggableId={todo.id} index={index}>
      {(provided) => (
        <li ref={provided.innerRef} {...provided.draggableProps} 
          style={{ ...provided.draggableProps.style, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span {...provided.dragHandleProps} style={{ color: '#616161', cursor: 'grab', fontSize: '18px', userSelect: 'none' }}>⠿</span>
          {editingId === todo.id ? (
            <input value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus style={{ width: '300px', padding: '0px 8px' }}
              onKeyDown={(e) => e.key === 'Enter' && (editTodo(todo.id, editText), setEditingId(null))}
              onBlur={() => setEditingId(null)} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
              <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id, !todo.completed)} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: todo.completed ? 'green' : 'black' }}>
                {todo.title}
              </span>
            </div>
          )}
          <button onClick={() => { setEditingId(todo.id); setEditText(todo.title); }} style={{ fontSize: '18px', transform: 'scaleX(-1)', cursor: 'pointer' }}>✎</button>
          <button onClick={() => deleteTodo(todo.id, todo.title)} style={{ color: 'red', cursor: 'pointer' }}>[x]</button>
          <Link href={`/todos/${todo.id}`}><button style={{ cursor: 'pointer', transform: 'scaleX(-1)', fontSize: '30px' }}>⌕</button></Link>
        </li>
      )}
    </Draggable>
  );

  if (loading) return <p style={{ padding: '70px' }}>Loading your tasks...</p>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <main style={{ padding: '70px', fontFamily: 'sans-serif' }}>
        <h1>My To-Do List</h1>
        <button onClick={() => setIsModalOpen(true)} style={{ padding: '10px 15px', backgroundColor: '#08a100', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>
          Add New Task
        </button>

        <div style={{ display: 'flex', gap: '50px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>In Progress</h2>
            <Droppable droppableId="active-list">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} style={{ paddingLeft: '0px', minHeight: '200px' }}>
                  {todos.filter(t => !t.completed).map((todo, index) => <TodoItemRow key={todo.id} todo={todo} index={index} />)}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ borderBottom: '2px solid green', paddingBottom: '10px', color: 'green' }}>Completed</h2>
            <Droppable droppableId="completed-list">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} style={{ paddingLeft: '0px', minHeight: '200px' }}>
                  {todos.filter(t => t.completed).map((todo, index) => <TodoItemRow key={todo.id} todo={todo} index={index} />)}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0 }}>New Task</h2>
            <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px' }}>Title</label>
              <input style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid black' }} value={newTodo.title} onChange={(e) => setNewTodo({...newTodo, title: e.target.value})} /></div>
            <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px' }}>Description</label>
              <textarea style={{ width: '100%', height: '80px', padding: '10px', marginTop: '5px', boxSizing: 'border-box', resize: 'vertical', border: '1px solid black' }} value={newTodo.description} onChange={(e) => setNewTodo({...newTodo, description: e.target.value})} /></div>
            <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', fontWeight: 'bold', fontSize: '14px' }}>Due Date</label>
              <input type="datetime-local" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid black' }} value={newTodo.due_date || ''} onChange={(e) => setNewTodo({...newTodo, due_date: e.target.value})} /></div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => {setNewTodo({ title: '', description: '', due_date: '' }); setIsModalOpen(false)}} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>Cancel</button>
              <button onClick={addTodo} style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Create Task</button>
            </div>
          </div>
        </div>
      )}
    </DragDropContext>
  );
}