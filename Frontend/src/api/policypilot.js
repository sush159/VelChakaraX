const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `Request failed: ${path}`)
  }

  return res.json()
}

export async function askQuestion(question) {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) {
    throw new Error('Failed to get answer')
  }

  return res.json()
}

export async function runSimulation(systemDescription) {
  const res = await fetch(`${BASE_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(systemDescription),
  })

  if (!res.ok) {
    throw new Error('Failed to run simulation')
  }

  return res.json()
}

// -----------------------------
// Bookmarks
// -----------------------------
export async function getBookmarks() {
  return request('/bookmarks')
}

export async function createBookmark(bookmark) {
  return request('/bookmarks', {
    method: 'POST',
    body: JSON.stringify(bookmark),
  })
}

export async function toggleBookmarkItem(bookmarkId, regulationId) {
  return request(`/bookmarks/${bookmarkId}/items/${regulationId}`, {
    method: 'PATCH',
  })
}

export async function deleteBookmark(bookmarkId) {
  return request(`/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
  })
}

// -----------------------------
// History
// -----------------------------
export async function getHistory() {
  return request('/history')
}

export async function createHistoryEntry(entry) {
  return request('/history', {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}

export async function deleteHistoryEntry(entryId) {
  return request(`/history/${entryId}`, {
    method: 'DELETE',
  })
}

// -----------------------------
// Chat sessions & messages
// -----------------------------
export async function getChatSessions() {
  return request('/chat/sessions')
}

export async function getChatMessages(limit = 100) {
  return request(`/chat/messages?limit=${limit}`)
}

// -----------------------------
// Simulations & documents
// -----------------------------
export async function getSimulations(limit = 100) {
  return request(`/simulations?limit=${limit}`)
}

export async function getDocuments() {
  return request('/documents')
}
