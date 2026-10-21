import React, { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from './api'

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [dbInfo, setDbInfo] = useState({ database: 'taskmanager', connected: false })

  // Inline edit state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [updating, setUpdating] = useState(false)

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:5000/')
      if (res.ok) {
        const data = await res.json()
        setDbInfo({
          database: data.database || 'taskmanager',
          connected: !!data.mongoConnected
        })
      }
    } catch {
      // Backend starting or network unavailable
    }
  }

  const loadTasks = async () => {
    try {
      setLoading(true)
      setApiError(null)
      const data = await getTasks()
      setTasks(data)
      checkHealth()
    } catch (err) {
      console.error(err)
      setApiError('Unable to connect to Backend API (port 5000). Ensure docker-compose is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setSubmitting(true)
      const created = await createTask({
        title: title.trim(),
        description: description.trim(),
        priority
      })
      setTasks((prev) => [created, ...prev])
      setTitle('')
      setDescription('')
      setPriority('medium')
    } catch (err) {
      alert(`Error creating task: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (task) => {
    try {
      const updated = await updateTask(task._id, { completed: !task.completed })
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)))
    } catch (err) {
      alert(`Error updating task: ${err.message}`)
    }
  }

  const startEdit = (task) => {
    setEditingId(task._id)
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditPriority(task.priority || 'medium')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDesc('')
    setEditPriority('medium')
  }

  const handleUpdate = async (id) => {
    if (!editTitle.trim()) {
      alert('Task title cannot be empty')
      return
    }

    try {
      setUpdating(true)
      const updated = await updateTask(id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority
      })
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)))
      setEditingId(null)
    } catch (err) {
      alert(`Error updating task: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t._id !== id))
    } catch (err) {
      alert(`Error deleting task: ${err.message}`)
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="container">
      <header className="header">
        <div className="badge-row">
          <span className="badge badge-network">Docker Compose Stack</span>
          <span className="badge badge-db">Database: {dbInfo.database}</span>
          <span className="badge badge-service">Frontend: 5173</span>
          <span className="badge badge-service">Backend: 5000</span>
          <span className="badge badge-service">MongoDB: 27017</span>
        </div>
        <h1>Task Management App</h1>
        <p className="subtitle">
          CHARUSAT ITUE301 &bull; Practical 11: Multi-Container Orchestration with Docker &amp; Docker Compose
        </p>
      </header>

      {apiError && (
        <div className="alert-box">
          <span>&#9888; {apiError}</span>
          <button className="btn-retry" onClick={loadTasks}>Retry</button>
        </div>
      )}

      <main className="content">
        <div className="card">
          <div className="card-header">
            <h3>Add New Task</h3>
            <span className="info-tag">Target DB: {dbInfo.database} (tasks collection)</span>
          </div>
          <form onSubmit={handleSubmit} className="form">
            <div className="input-group">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="input-row">
              <input
                type="text"
                className="input-desc"
                placeholder="Additional description or notes (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <select
                className="priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                title="Task Priority"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding Task...' : '+ Add Task'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header list-header">
            <div>
              <h3>Tasks in MongoDB ({tasks.length})</h3>
              <p className="meta-text">
                Database: <strong>{dbInfo.database}</strong> &bull; Collection: <strong>tasks</strong> &bull; {completedCount} completed &bull; {tasks.length - completedCount} active
              </p>
            </div>
            <div className="filter-group">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({tasks.length})
              </button>
              <button
                className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active ({tasks.length - completedCount})
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching tasks from MongoDB container ({dbInfo.database})...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No tasks found in MongoDB ({dbInfo.database})</p>
              <p className="empty-sub">
                {filter === 'all'
                  ? 'Add your first task above to verify full multi-container roundtrip!'
                  : `No ${filter} tasks right now.`}
              </p>
            </div>
          ) : (
            <div className="list">
              {filteredTasks.map((task) => (
                <div key={task._id} className={`item ${task.completed ? 'completed' : ''}`}>
                  {editingId === task._id ? (
                    <div className="edit-form-wrap">
                      <input
                        type="text"
                        className="edit-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Task title"
                        required
                      />
                      <div className="edit-input-row">
                        <input
                          type="text"
                          className="edit-input"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Task description"
                        />
                        <select
                          className="edit-priority-select"
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="edit-btn-row">
                        <button
                          className="btn-save"
                          onClick={() => handleUpdate(task._id)}
                          disabled={updating}
                        >
                          {updating ? 'Saving...' : 'Save Update'}
                        </button>
                        <button className="btn-cancel" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="item-left">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={!!task.completed}
                          onChange={() => handleToggle(task)}
                          title="Click to toggle Completed / Pending status in MongoDB"
                        />
                        <div className="item-body">
                          <div className="title-row">
                            <h4 className="item-title">{task.title}</h4>
                            <span className={`status-pill ${task.completed ? 'pill-done' : 'pill-pending'}`}>
                              {task.completed ? 'Completed' : 'Pending'}
                            </span>
                            {task.priority && (
                              <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>
                                {task.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                          {task.description && <p className="item-desc">{task.description}</p>}
                          <div className="item-meta">
                            <span className="item-time">
                              {new Date(task.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="item-id" title="MongoDB Document _id">
                              _id: {task._id}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(task)}
                          title="Edit this task in MongoDB"
                        >
                          Edit
                        </button>
                        <button
                          className="del-btn"
                          onClick={() => handleDelete(task._id)}
                          title="Delete task from MongoDB"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
