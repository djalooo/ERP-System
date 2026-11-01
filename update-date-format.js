// Script to update date format from "September 3, 2025" to "03/09/2025"
// This script will update any stored data that contains the old date format

const fs = require('fs');
const path = require('path');

// Function to update localStorage data
function updateDateInLocalStorage() {
  console.log('This script needs to be run in the browser console to access localStorage');
  console.log('Copy and paste the following code in your browser console:');
  console.log('');
  console.log('// Update date format in localStorage');
  console.log('Object.keys(localStorage).forEach(key => {');
  console.log('  try {');
  console.log('    const value = localStorage.getItem(key);');
  console.log('    if (value && value.includes("September 3, 2025")) {');
  console.log('      const updatedValue = value.replace(/September 3, 2025/g, "03/09/2025");');
  console.log('      localStorage.setItem(key, updatedValue);');
  console.log('      console.log(`Updated ${key}`);');
  console.log('    }');
  console.log('  } catch (e) {');
  console.log('    console.log(`Error processing ${key}:`, e);');
  console.log('  }');
  console.log('});');
  console.log('console.log("Date format update completed!");');
  console.log('window.location.reload(); // Reload page to see changes');
}

// If running in Node.js environment
if (typeof window === 'undefined') {
  updateDateInLocalStorage();
} else {
  // If running in browser
  Object.keys(localStorage).forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value && value.includes("September 3, 2025")) {
        const updatedValue = value.replace(/September 3, 2025/g, "03/09/2025");
        localStorage.setItem(key, updatedValue);
        console.log(`Updated ${key}`);
      }
    } catch (e) {
      console.log(`Error processing ${key}:`, e);
    }
  });
  console.log("Date format update completed!");
  window.location.reload();
}