/**
 * CUSTOMER VIEW - MAIN.JS
 * Entry point for the customer-facing menu browsing interface
 * Fetches menu data from local API and initializes the display
 */

// Import modules for creating menu listings and nutritional filters
import { createListings } from './items.js';
import { createNutritionalFilters } from './filter.js';

// === FETCH MENU DATA ===
// Fetch McDonald's menu data from local database API
fetch('/data')
  .then(response => response.json())
  .then(menuItems => {
    // Log fetched data for debugging
    console.log('McDonald\'s Menu Items:', menuItems);
    console.log('Total items:', menuItems.length);
    
    // Log categories for debugging - get unique category values
    const categories = [...new Set(menuItems.map(item => item.CATEGORY))];
    console.log('Available categories:', categories);
    
    // Create category listings - display menu items grouped by category
    createListings(menuItems);
    
    // Create nutritional filters - add interactive filtering UI
    createNutritionalFilters(menuItems);
  })
  .catch(error => {
    // Handle errors gracefully - show user-friendly error message
    console.error('Error fetching menu data:', error);
    document.querySelector('main').innerHTML = '<p>Error loading menu data. Please try again later.</p>';
  });


  
