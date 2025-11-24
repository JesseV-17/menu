import { setCategoryFilter, clearCategoryFilter, showAllCategories } from './filter.js';

// McDonald's menu listings for each category
const createListings = (menuItems) => {

  // Group items by category
  const categories = {};
  menuItems.forEach(item => {
    const category = item.CATEGORY;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });

  // Create filter buttons
  createFilterButtons(categories);

  // Store categories and items for filtering
  window.menuCategories = categories;
  window.allMenuItems = menuItems;
  
  // Display all categories by default when page loads
  const resultsContainer = document.getElementById('results-container');
  Object.entries(categories)
    .filter(([categoryName, items]) => items.length > 0)
    .forEach(([categoryName, items]) => {
      displayCategoryItems(categoryName, items, resultsContainer);
    });
};

// Create filter buttons for each category
function createFilterButtons(categories) {
  const main = document.querySelector('main');
  
  // Create filter container
  const filterContainer = document.createElement('div');
  filterContainer.classList.add('filter-container');

  
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('filter-buttons');
  
  // Add "Show All" button
  const showAllBtn = document.createElement('button');
  showAllBtn.textContent = 'Show All';
  showAllBtn.classList.add('filter-btn', 'active');
  showAllBtn.addEventListener('click', () => showAllCategoriesLocal());
  buttonContainer.appendChild(showAllBtn);
  
  // Create buttons for each category
  Object.keys(categories).forEach(categoryKey => {
    if (categories[categoryKey].length > 0) {
      const button = document.createElement('button');
      button.textContent = formatCategoryName(categoryKey);
      button.classList.add('filter-btn');
      button.dataset.category = categoryKey;
      button.addEventListener('click', () => filterByCategory(categoryKey, button));
      buttonContainer.appendChild(button);
    }
  });
  
  filterContainer.appendChild(buttonContainer);
  main.appendChild(filterContainer);
  
  // Create container for filtered results
  const resultsContainer = document.createElement('div');
  resultsContainer.classList.add('results-container');
  resultsContainer.id = 'results-container';
  main.appendChild(resultsContainer);
}

// Filter items by category
function filterByCategory(categoryKey, clickedButton) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  clickedButton.classList.add('active');
  
  // Use the integrated filter system
  setCategoryFilter(categoryKey);
}

// Show all categories
function showAllCategoriesLocal() {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.filter-btn').classList.add('active'); // First button is "Show All"
  
  // Use the integrated filter system
  showAllCategories();
}

// Display items for a specific category
function displayCategoryItems(categoryName, items, container, activeFilter = null) {
  // Create section for this category
  const section = document.createElement('section');
  section.classList.add(categoryName.toLowerCase());
  
  // Add a category header
  const categoryHeader = document.createElement('h3');
  categoryHeader.textContent = formatCategoryName(categoryName);
  section.appendChild(categoryHeader);
  
  // Add item count
  const itemCount = document.createElement('p');
  itemCount.classList.add('item-count');
  itemCount.textContent = `Found ${items.length} items`;
  section.appendChild(itemCount);
  
  // Iterate over the list of items for this category
  items.forEach((item, index) => {
    // Create a unique ID for each item
    const itemId = `${categoryName}-${index}`;
    
    // Get a placeholder image URL (you can replace this with actual McDonald's images if available)
    const iconURL = getItemImageURL(item.ITEM);
    
    // assign a unique ID to the popover
    const popoverId = `${categoryName}-${index}`;
    
    // make a div / template for each listing. 
    const div = document.createElement('div');
    div.classList.add('listing');
    
    // Add nutritional highlights based on the active filter
    const nutritionalHighlight = getNutritionalHighlight(item, activeFilter);
    
    // the template includes a button to open the popover
    // as well as a placeholder for the popover itself.
    
    // Extract item name and weight (grams/ounces) using pattern matching
    const itemText = item.ITEM;
    let cleanedName = itemText;
    let grams = '';
    let ounces = '';
    
    // Match various gram formats:
    // 1. "5.0 oz (250 g)" - oz with grams in parentheses
    let gramsMatch = itemText.match(/\s*([\d.]+)\s*oz\s*\((\d+)\s*g\)\s*$/);
    if (gramsMatch) {
      ounces = gramsMatch[1];
      grams = gramsMatch[2];
      cleanedName = itemText.replace(/\s*[\d.]+\s*oz\s*\(\d+\s*g\)\s*$/, '');
    } else {
      // 2. "(5g)" - grams in parentheses at the end
      gramsMatch = itemText.match(/\s*\((\d+)\s*g\)\s*$/);
      if (gramsMatch) {
        grams = gramsMatch[1];
        cleanedName = itemText.replace(/\s*\(\d+\s*g\)\s*$/, '');
      } else {
        // 3. "5g" - standalone grams at the end
        gramsMatch = itemText.match(/\s+(\d+)\s*g\s*$/);
        if (gramsMatch) {
          grams = gramsMatch[1];
          cleanedName = itemText.replace(/\s+\d+\s*g\s*$/, '');
        }
      }
      
      // 4. "(5oz)" - ounces in parentheses at the end
      if (!grams) {
        const ouncesMatch = itemText.match(/\s*\(([\d.]+)\s*oz\)\s*$/);
        if (ouncesMatch) {
          ounces = ouncesMatch[1];
          cleanedName = itemText.replace(/\s*\([\d.]+\s*oz\)\s*$/, '');
        } else {
          // 5. "5oz" - standalone ounces at the end
          const ouncesMatch2 = itemText.match(/\s+([\d.]+)\s*oz\s*$/);
          if (ouncesMatch2) {
            ounces = ouncesMatch2[1];
            cleanedName = itemText.replace(/\s+[\d.]+\s*oz\s*$/, '');
          }
        }
      }
    }
    
    const itemName = cleanedName;
    
    let template = `
      <button class="open" data-popup-id="${popoverId}">
        <span class="item-name">${itemName}</span>
        ${grams ? `<span class="item-grams">${grams}g</span>` : ''}
        ${ounces && !grams ? `<span class="item-ounces">${ounces}oz</span>` : ''}
        ${nutritionalHighlight}
      </button>
      <div class="popup-overlay" id="${popoverId}" style="display: none;">
        <div class="popup-content">
          <div class="profile">
            Loading nutritional information...
          </div>
        </div>
      </div>`;
    
    div.innerHTML = DOMPurify.sanitize(template);
    
    // Store the item data for the popup
    window.menuItemsData = window.menuItemsData || {};
    window.menuItemsData[popoverId] = item;
    
    // Add click event listener to the button
    const button = div.querySelector('.open');
    if (button) {
      button.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Button clicked, opening popup:', popoverId);
        
        if (window.openNutritionPopup) {
          await window.openNutritionPopup(popoverId);
        } else {
          console.error('openNutritionPopup function not available');
        }
      });
    }
    
    // add this listing to the section for this category
    section.appendChild(div);
  });
  
  // add this section to the main part of the page
  container.appendChild(section);
}

// Helper function to format category names for display
function formatCategoryName(categoryName) {
  const categoryMap = {
    'BURGERSANDWICH': 'Burgers & Sandwiches',
    'CHICKENFISH': 'Chicken & Fish',
    'BREAKFAST': 'Breakfast',
    'SALAD': 'Salads',
    'SNACKSIDE': 'Snacks & Sides',
    'BEVERAGE': 'Beverages',
    'MCCAFE': 'McCafé',
    'DESSERTSHAKE': 'Desserts & Shakes',
    'CONDIMENT': 'Condiments',
    'ALLDAYBREAKFAST': 'All Day Breakfast'
  };
  
  return categoryMap[categoryName] || categoryName.replace(/([A-Z])/g, ' $1').trim();
}

// Helper function to get item image URL (placeholder for now)
function getItemImageURL(itemName) {
  // For now, return a placeholder. In a real implementation, you might:
  // 1. Have a mapping of item names to image URLs
  // 2. Use a service that generates food images
  // 3. Use McDonald's official images if available
  return 'https://via.placeholder.com/100x100?text=🍔';
}

// Get nutritional highlight for an item based on active filter
function getNutritionalHighlight(item, activeFilter = null) {
  if (!activeFilter) return '';
  
  const protein = parseInt(item.PRO) || 0;
  const fiber = parseInt(item.FBR) || 0;
  const carbs = parseInt(item.CARB) || 0;
  const sugar = parseInt(item.SGR) || 0;
  const calories = parseInt(item.CAL) || 0;
  
  // Only show the highlight that matches the active filter
  switch(activeFilter) {
    case 'high-protein':
      if (protein >= 20) return `<span class="nutritional-highlight">${protein}g protein</span>`;
      break;
    case 'gut-friendly':
      if (fiber >= 5) return `<span class="nutritional-highlight">${fiber}g fiber</span>`;
      break;
    case 'low-carb':
      if (carbs <= 20) return `<span class="nutritional-highlight">${carbs}g carbs</span>`;
      break;
    case 'low-sugar':
      if (sugar <= 10) return `<span class="nutritional-highlight">${sugar}g sugar</span>`;
      break;
    case 'calorie-conscious':
      if (calories <= 400) return `<span class="nutritional-highlight">${calories} cal</span>`;
      break;
    default:
      return '';
  }
  
  return '';
}

export { createListings, displayCategoryItems, formatCategoryName, getItemImageURL };