document.addEventListener('DOMContentLoaded', function() {
    const noteInput = document.getElementById('noteInput');
    const websiteInput = document.getElementById('websiteInput');
    const saveNoteBtn = document.getElementById('saveNote');
    const searchInput = document.getElementById('searchInput');
    const notesList = document.getElementById('notesList');
    const exportBtn = document.getElementById('exportNotes');
    const importBtn = document.getElementById('importNotes');
    const fileInput = document.getElementById('fileInput');
    const openDashboardBtn = document.getElementById('openDashboard');
   
    
    function loadNotes() {
      chrome.storage.local.get(['notes'], function(result) {
        const notes = result.notes || [];
        displayNotes(notes);
      });
    }
  
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]?.url) {
        websiteInput.value = tabs[0].url;
      }
    });
  
    openDashboardBtn.addEventListener('click', function() {
      chrome.tabs.create({url: 'dashboard.html'});
    });
  
    function displayNotes(notes, searchTerm = '') {
      notesList.innerHTML = '';
      const filteredNotes = notes.filter(note => 
        (note.website && note.website.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  
      filteredNotes.forEach((note, index) => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item bg-white p-4 rounded-lg shadow-md note-transition';
    
        const truncatedWebsiteTitle = note.websiteTitle && note.websiteTitle.length > 35 
          ? note.websiteTitle.substring(0, 35) + '...' 
          : note.websiteTitle;
  
        const truncatedURL = note.website && note.website.length > 30 
          ? note.website.substring(0, 30) + '...' 
          : note.website;
        
        const fullNote = note.content.length > 75 
          ? note.content.substring(0, 150) + '...' 
          : note.content;
        const formattedNote = fullNote.match(/.{1,40}/g)?.join('<br>') || fullNote;
        const content = document.createElement('div');
        content.className = 'text-gray-800 mb-2';
        content.innerHTML = formattedNote; 
        const website = document.createElement('a');
        if (note.website) {
          website.href = note.website;
          website.className = 'text-blue-500 hover:text-blue-600 text-sm block mb-2';
          website.textContent = truncatedURL;
          website.target = '_blank';
        }
        const timestamp = document.createElement('div');
        timestamp.className = 'text-gray-500 text-sm mb-2';
        timestamp.textContent = new Date(note.timestamp).toLocaleString();
        const actions = document.createElement('div');
        actions.className = 'flex gap-2';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editNote(index, note);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteNote(index);
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        noteElement.appendChild(content);
        if (note.website) noteElement.appendChild(website);
        noteElement.appendChild(timestamp);
        noteElement.appendChild(actions);
        notesList.appendChild(noteElement);
      });
    }
  
    function saveNote() {
      const content = noteInput.value.trim();
      const website = websiteInput.value.trim();
      
      if (content) {
        chrome.storage.local.get(['notes'], function(result) {
          const notes = result.notes || [];
          notes.unshift({
            content: content,
            website: website,
            websiteTitle: websiteInput.value.split('/')[2],
            timestamp: new Date().getTime()
          });
          chrome.storage.local.set({ notes: notes }, function() {
            noteInput.value = '';
            websiteInput.value = '';
            loadNotes();
          });
        });
      }
    }
  
    function editNote(index, note) {
      const newContent = prompt('Edit note:', note.content);
      if (newContent !== null) {
        chrome.storage.local.get(['notes'], function(result) {
          const notes = result.notes;
          notes[index].content = newContent;
          notes[index].timestamp = new Date().getTime();
          chrome.storage.local.set({ notes: notes }, loadNotes);
        });
      }
    }
  
    function deleteNote(index) {
      if (confirm('Are you sure you want to delete this note?')) {
        chrome.storage.local.get(['notes'], function(result) {
          const notes = result.notes;
          notes.splice(index, 1);
          chrome.storage.local.set({ notes: notes }, loadNotes);
        });
      }
    }
    exportBtn.addEventListener('click', function() {
      chrome.storage.local.get(['notes'], function(result) {
        const notes = result.notes || [];
        const blob = new Blob([JSON.stringify(notes, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes_backup.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
    importBtn.addEventListener('click', function() {
      fileInput.click();
    });
  
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const importedNotes = JSON.parse(e.target.result);
            if (Array.isArray(importedNotes)) {
              chrome.storage.local.set({ notes: importedNotes }, function() {
                loadNotes();
                alert('Notes imported successfully!');
              });
            }
          } catch (error) {
            alert('Error importing notes. Please make sure the file is valid.');
          }
        };
        reader.readAsText(file);
      }
    });
    saveNoteBtn.addEventListener('click', saveNote);
    searchInput.addEventListener('input', function() {
      chrome.storage.local.get(['notes'], function(result) {
        displayNotes(result.notes || [], searchInput.value);
      });
    });
    loadNotes();
  });
  