document.addEventListener('DOMContentLoaded', function() {
    const notesGrid = document.getElementById('notesGrid');
    const searchInput = document.getElementById('dashboardSearch');
    const sortSelect = document.getElementById('sortSelect');
    const totalNotesEl = document.getElementById('totalNotes');
    const weeklyNotesEl = document.getElementById('weeklyNotes');
  
    function updateStats(notes) {
      if (!Array.isArray(notes)) notes = [];
      
      const oneWeekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
      const weeklyNotes = notes.filter(note => note && note.timestamp > oneWeekAgo).length;
  
      totalNotesEl.textContent = notes.length; 
      weeklyNotesEl.textContent = weeklyNotes;
    }
  
    function displayNotes(notes, searchTerm = '') {
      if (!Array.isArray(notes)) notes = [];
      
      notesGrid.innerHTML = '';
      let displayNotes = notes.filter(note => 
        note && (!searchTerm || (note.website && note.website.toLowerCase().includes(searchTerm.toLowerCase())))
      );
      
      switch(sortSelect.value) {
        case 'oldest':
          displayNotes.sort((a, b) => a.timestamp - b.timestamp);
          break;
        case 'website':
          displayNotes.sort((a, b) => (a.website || '').localeCompare(b.website || ''));
          break;
        default: 
          displayNotes.sort((a, b) => b.timestamp - a.timestamp);
      }
  
      displayNotes.forEach((note, index) => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
        
        noteCard.innerHTML = `
          <div class="note-content mb-4">
            <p class="text-gray-800">${note.content || ''}</p>
            ${note.website ? ` 
              <a href="${note.website}" 
                 target="_blank" 
                 class="text-blue-500 hover:text-blue-600 text-sm block mt-2 truncate">
                ${note.website}
              </a>
            ` : ''}
          </div>
          <div class="text-gray-500 text-sm mb-4">
            ${new Date(note.timestamp).toLocaleString()}
          </div>
          <div class="flex gap-2">
            <button id="editButton-${index}" 
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Edit
            </button>
            <button id="deleteButton-${index}" 
                    class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Delete
            </button>
          </div>
        `;
  
        const editButton = noteCard.querySelector(`#editButton-${index}`);
        const deleteButton = noteCard.querySelector(`#deleteButton-${index}`);
  
        editButton.addEventListener('click', function() {
          editNote(index);
        });
  
        deleteButton.addEventListener('click', function() {
          deleteNote(index);
        });
  
        notesGrid.appendChild(noteCard);
      });
    }
  
    searchInput.addEventListener('input', function() {
      chrome.storage.local.get(['notes'], function(result) {
        displayNotes(result.notes || [], searchInput.value);
      });
    });
  
    sortSelect.addEventListener('change', function() {
      chrome.storage.local.get(['notes'], function(result) {
        displayNotes(result.notes || [], searchInput.value);
      });
    });
  
    chrome.storage.local.get(['notes'], function(result) {
      let notes = Array.isArray(result.notes) ? result.notes : [];
      updateStats(notes);
      displayNotes(notes);
    });
  
    window.editNote = function(index) {
      chrome.storage.local.get(['notes'], function(result) {
        const notes = Array.isArray(result.notes) ? result.notes : [];
        if (!notes[index]) return;

        const newContent = prompt('Edit note:', notes[index].content);
        if (newContent !== null) {
          notes[index].content = newContent;
          notes[index].timestamp = new Date().getTime();
          chrome.storage.local.set({ notes: notes }, function() {
            displayNotes(notes, searchInput.value);
            updateStats(notes);
          });
        }
      });
    };
  
    window.deleteNote = function(index) {
      if (confirm('Are you sure you want to delete this note?')) {
        chrome.storage.local.get(['notes'], function(result) {
          const notes = Array.isArray(result.notes) ? result.notes : [];
          notes.splice(index, 1);
          chrome.storage.local.set({ notes: notes }, function() {
            displayNotes(notes, searchInput.value);
            updateStats(notes);
          });
        });
      }
    };
});