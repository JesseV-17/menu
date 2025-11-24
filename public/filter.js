// Nutritional filtering functionality for McDonald's menu items

// Global state for active filters
let activeNutritionalFilter = null;
let activeCategoryFilter = null;

// Import functions from listings.js
let displayCategoryItems, formatCategoryName, getItemImageURL;

// Initialize imports
async function initializeImports() {
  const module = await import('./items.js');
  displayCategoryItems = module.displayCategoryItems;
  formatCategoryName = module.formatCategoryName;
  getItemImageURL = module.getItemImageURL;
}

// Nutritional filter criteria with ranges
const FILTER_CRITERIA = {
  'calorie-conscious': {
    name: 'Calorie Conscious',
    description: 'Filter by calorie range',
    field: 'CAL',
    unit: 'cal',
    min: 0,
    max: 1500,
    defaultMin: 0,
    defaultMax: 400,
    filter: (item, minVal, maxVal) => {
      const value = parseInt(item.CAL) || 0;
      return value >= minVal && value <= maxVal;
    }
  },
  'high-protein': {
    name: 'High Protein',
    description: 'Filter by protein range',
    field: 'PRO',
    unit: 'g protein',
    min: 0,
    max: 100,
    defaultMin: 20,
    defaultMax: 100,
    filter: (item, minVal, maxVal) => {
      const value = parseInt(item.PRO) || 0;
      return value >= minVal && value <= maxVal;
    }
  },
  'low-carb': {
    name: 'Low Carb / Carb Smart',
    description: 'Filter by carbohydrate range',
    field: 'CARB',
    unit: 'g carbs',
    min: 0,
    max: 150,
    defaultMin: 0,
    defaultMax: 20,
    filter: (item, minVal, maxVal) => {
      const value = parseInt(item.CARB) || 0;
      return value >= minVal && value <= maxVal;
    }
  },
  'low-sugar': {
    name: 'Low Sugar',
    description: 'Filter by sugar range',
    field: 'SGR',
    unit: 'g sugar',
    min: 0,
    max: 120,
    defaultMin: 0,
    defaultMax: 10,
    filter: (item, minVal, maxVal) => {
      const value = parseInt(item.SGR) || 0;
      return value >= minVal && value <= maxVal;
    }
  },
  'gut-friendly': {
    name: 'Gut Friendly',
    description: 'Filter by fiber range',
    field: 'FBR',
    unit: 'g fiber',
    min: 0,
    max: 20,
    defaultMin: 5,
    defaultMax: 20,
    filter: (item, minVal, maxVal) => {
      const value = parseInt(item.FBR) || 0;
      return value >= minVal && value <= maxVal;
    }
  }
};

// Create nutritional filter buttons and functionality
async function createNutritionalFilters(menuItems) {
  // Initialize imports
  await initializeImports();
  
  const main = document.querySelector('main');
  
  // Create nutritional filter container
  const nutritionalFilterContainer = document.createElement('div');
  nutritionalFilterContainer.classList.add('nutritional-filter-container');
  
  const filterTitle = document.createElement('h2');
  filterTitle.textContent = 'Nutritional Filters';
  nutritionalFilterContainer.appendChild(filterTitle);
  
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('nutritional-filter-buttons');
  
  // Add "Clear Filters" button
  const clearFiltersBtn = document.createElement('button');
  clearFiltersBtn.textContent = 'Clear Filters';
  clearFiltersBtn.classList.add('nutritional-filter-btn', 'clear-btn', 'active');
  clearFiltersBtn.addEventListener('click', () => clearNutritionalFilters());
  buttonContainer.appendChild(clearFiltersBtn);
  
  // Create buttons for each nutritional filter
  Object.entries(FILTER_CRITERIA).forEach(([filterKey, filterData]) => {
    const filterGroup = document.createElement('div');
    filterGroup.classList.add('nutritional-filter-group');
    
    const button = document.createElement('button');
    button.textContent = filterData.name;
    button.classList.add('nutritional-filter-btn');
    button.dataset.filter = filterKey;
    button.title = filterData.description;
    button.addEventListener('click', () => toggleNutritionalFilter(filterKey, button, menuItems));
    
    // Create range slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.classList.add('slider-container', 'hidden');
    sliderContainer.id = `slider-${filterKey}`;
    
    const sliderLabel = document.createElement('div');
    sliderLabel.classList.add('slider-label');
    sliderLabel.innerHTML = `
      <span>${filterData.name}</span>
      <span class="range-display" id="range-${filterKey}">
        ${filterData.defaultMin} - ${filterData.defaultMax} ${filterData.unit}
      </span>
    `;
    
    const sliderWrapper = document.createElement('div');
    sliderWrapper.classList.add('slider-wrapper');
    
    // Min value slider
    const minSlider = document.createElement('input');
    minSlider.type = 'range';
    minSlider.min = filterData.min;
    minSlider.max = filterData.max;
    minSlider.value = filterData.defaultMin;
    minSlider.classList.add('range-slider', 'min-slider');
    minSlider.id = `min-${filterKey}`;
    
    // Max value slider
    const maxSlider = document.createElement('input');
    maxSlider.type = 'range';
    maxSlider.min = filterData.min;
    maxSlider.max = filterData.max;
    maxSlider.value = filterData.defaultMax;
    maxSlider.classList.add('range-slider', 'max-slider');
    maxSlider.id = `max-${filterKey}`;
    
    // Add event listeners for sliders
    const updateRange = () => {
      const minVal = parseInt(minSlider.value);
      const maxVal = parseInt(maxSlider.value);
      
      // Ensure min doesn't exceed max
      if (minVal > maxVal) {
        minSlider.value = maxVal;
      }
      // Ensure max doesn't go below min
      if (maxVal < minVal) {
        maxSlider.value = minVal;
      }
      
      const finalMin = parseInt(minSlider.value);
      const finalMax = parseInt(maxSlider.value);
      
      document.getElementById(`range-${filterKey}`).textContent = 
        `${finalMin} - ${finalMax} ${filterData.unit}`;
      
      // Apply filter with new range if this filter is active
      if (activeNutritionalFilter === filterKey) {
        applyCombinedFiltersWithRange(window.allMenuItemsForFiltering, filterKey, finalMin, finalMax);
      }
    };
    
    minSlider.addEventListener('input', updateRange);
    maxSlider.addEventListener('input', updateRange);
    
    sliderWrapper.appendChild(minSlider);
    sliderWrapper.appendChild(maxSlider);
    
    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(sliderWrapper);
    
    filterGroup.appendChild(button);
    filterGroup.appendChild(sliderContainer);
    
    buttonContainer.appendChild(filterGroup);
  });
  
  nutritionalFilterContainer.appendChild(buttonContainer);
  
  // Create a grid wrapper for two-column layout
  const contentGrid = document.createElement('div');
  contentGrid.classList.add('content-grid');
  
  // Find the results container
  const resultsContainer = document.getElementById('results-container');
  
  // Insert the grid after the category filter container
  const categoryFilter = document.querySelector('.filter-container');
  main.insertBefore(contentGrid, categoryFilter.nextSibling);
  
  // Move nutritional filters into the left column
  contentGrid.appendChild(nutritionalFilterContainer);
  
  // Move results container into the right column
  if (resultsContainer) {
    contentGrid.appendChild(resultsContainer);
  }
  
  // Store menu items for filtering
  window.allMenuItemsForFiltering = menuItems;
}

// Toggle nutritional filter and show/hide sliders
function toggleNutritionalFilter(filterKey, clickedButton, menuItems) {
  const sliderContainer = document.getElementById(`slider-${filterKey}`);
  
  if (activeNutritionalFilter === filterKey) {
    // Deactivate current filter
    activeNutritionalFilter = null;
    clickedButton.classList.remove('active');
    sliderContainer.classList.add('hidden');
    
    // Clear nutritional filter and apply category filter if active
    clearNutritionalFilters();
  } else {
    // Hide all other sliders and deactivate buttons
    document.querySelectorAll('.nutritional-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.slider-container').forEach(container => container.classList.add('hidden'));
    
    // Activate new filter
    activeNutritionalFilter = filterKey;
    clickedButton.classList.add('active');
    sliderContainer.classList.remove('hidden');
    
    // Apply initial filter with current slider values
    const minVal = parseInt(document.getElementById(`min-${filterKey}`).value);
    const maxVal = parseInt(document.getElementById(`max-${filterKey}`).value);
    applyCombinedFiltersWithRange(menuItems, filterKey, minVal, maxVal);
  }
}

// Apply nutritional filter with range values
function applyNutritionalFilterWithRange(filterKey, minVal, maxVal, menuItems) {
  // Set active nutritional filter
  activeNutritionalFilter = filterKey;
  
  // Apply combined filters with range
  applyCombinedFiltersWithRange(menuItems, filterKey, minVal, maxVal);
}

// Apply combined category and nutritional filters with range
function applyCombinedFiltersWithRange(menuItems, filterKey, minVal, maxVal) {
  let filteredItems = menuItems;
  
  // Apply nutritional filter with range if active
  if (activeNutritionalFilter && filterKey) {
    const filterCriteria = FILTER_CRITERIA[filterKey];
    if (filterCriteria) {
      filteredItems = filteredItems.filter(item => filterCriteria.filter(item, minVal, maxVal));
    }
  }
  
  // Apply category filter if active
  if (activeCategoryFilter) {
    filteredItems = filteredItems.filter(item => item.CATEGORY === activeCategoryFilter);
  }
  
  // Clear previous results
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '';
  
  // Display filtered results
  if (filteredItems.length > 0) {
    if (activeNutritionalFilter && activeCategoryFilter) {
      // Both filters active - show combined results
      displayCombinedFilterResultsWithRange(filteredItems, resultsContainer, filterKey, minVal, maxVal);
    } else if (activeNutritionalFilter) {
      // Only nutritional filter active
      displayNutritionalFilterResultsWithRange(filterKey, filteredItems, resultsContainer, minVal, maxVal);
    } else if (activeCategoryFilter) {
      // Only category filter active
      displayCategoryOnlyResults(activeCategoryFilter, filteredItems, resultsContainer);
    }
  } else {
    // No results found
    displayNoResultsWithRange(resultsContainer, filterKey, minVal, maxVal);
  }
}

// Apply combined category and nutritional filters
function applyCombinedFilters(menuItems) {
  let filteredItems = menuItems;
  
  // Apply nutritional filter if active
  if (activeNutritionalFilter) {
    const filterCriteria = FILTER_CRITERIA[activeNutritionalFilter];
    if (filterCriteria) {
      filteredItems = filteredItems.filter(filterCriteria.filter);
    }
  }
  
  // Apply category filter if active
  if (activeCategoryFilter) {
    filteredItems = filteredItems.filter(item => item.CATEGORY === activeCategoryFilter);
  }
  
  // Clear previous results
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '';
  
  // Display filtered results
  if (filteredItems.length > 0) {
    if (activeNutritionalFilter && activeCategoryFilter) {
      // Both filters active - show combined results
      displayCombinedFilterResults(filteredItems, resultsContainer);
    } else if (activeNutritionalFilter) {
      // Only nutritional filter active
      displayNutritionalFilterResults(activeNutritionalFilter, filteredItems, resultsContainer);
    } else if (activeCategoryFilter) {
      // Only category filter active
      displayCategoryOnlyResults(activeCategoryFilter, filteredItems, resultsContainer);
    }
  } else {
    // No results found
    displayNoResults(resultsContainer);
  }
}

// Clear nutritional filters
function clearNutritionalFilters() {
  // Update active button
  document.querySelectorAll('.nutritional-filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.nutritional-filter-btn.clear-btn').classList.add('active');
  
  // Hide all sliders
  document.querySelectorAll('.slider-container').forEach(container => container.classList.add('hidden'));
  
  // Clear nutritional filter
  activeNutritionalFilter = null;
  
  // If category filter is still active, show those results
  if (activeCategoryFilter) {
    applyCombinedFilters(window.allMenuItemsForFiltering);
  } else {
    // Show all categories by default
    showAllCategories();
  }
}

// Display combined filter results (both category and nutritional filters active)
function displayCombinedFilterResults(filteredItems, container) {
  // Display items in a single section since they're all from one category
  if (filteredItems.length > 0) {
    displayCategoryItems(activeCategoryFilter, filteredItems, container, activeNutritionalFilter);
  }
}

// Display category-only results
function displayCategoryOnlyResults(categoryKey, filteredItems, container) {
  const categoryName = formatCategoryName(categoryKey);

  
  // Display items
  if (filteredItems.length > 0) {
    displayCategoryItems(categoryKey, filteredItems, container);
  }
}

// Display no results message
function displayNoResults(container) {
  let message = 'No items found';
  let description = 'No menu items match the selected criteria.';
  
  if (activeNutritionalFilter && activeCategoryFilter) {
    const nutritionalCriteria = FILTER_CRITERIA[activeNutritionalFilter];
    const categoryName = formatCategoryName(activeCategoryFilter);
    message = `No ${nutritionalCriteria.name} items in ${categoryName}`;
    description = `No ${categoryName} items match the ${nutritionalCriteria.name} criteria.`;
  } else if (activeNutritionalFilter) {
    const nutritionalCriteria = FILTER_CRITERIA[activeNutritionalFilter];
    message = `No ${nutritionalCriteria.name} items found`;
    description = `No menu items match the ${nutritionalCriteria.name} criteria.`;
  } else if (activeCategoryFilter) {
    const categoryName = formatCategoryName(activeCategoryFilter);
    message = `No ${categoryName} items found`;
    description = `No items found in the ${categoryName} category.`;
  }
  
  container.innerHTML = `
    <div class="no-results">
      <h3>${message}</h3>
      <p>${description}</p>
    </div>
  `;
}
function displayNutritionalFilterResults(filterKey, filteredItems, container) {
  const filterCriteria = FILTER_CRITERIA[filterKey];
  
  // Group items by category for better organization
  const categories = {};
  filteredItems.forEach(item => {
    const category = item.CATEGORY;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });
  
  // Display items grouped by category
  Object.entries(categories).forEach(([categoryName, items]) => {
    if (items.length > 0) {
      displayCategoryItems(categoryName, items, container, filterKey);
    }
  });
}

// Functions for category filter integration
function setCategoryFilter(categoryKey) {
  activeCategoryFilter = categoryKey;
  applyCombinedFilters(window.allMenuItemsForFiltering);
}

function clearCategoryFilter() {
  activeCategoryFilter = null;
  if (activeNutritionalFilter) {
    applyCombinedFilters(window.allMenuItemsForFiltering);
  }
}

function showAllCategories() {
  activeCategoryFilter = null;
  activeNutritionalFilter = null;
  
  // Clear nutritional filter selection
  document.querySelectorAll('.nutritional-filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.nutritional-filter-btn.clear-btn').classList.add('active');
  
  // Show all categories using the original logic from listings.js
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '';
  
  Object.entries(window.menuCategories)
    .filter(([categoryName, items]) => items.length > 0)
    .forEach(([categoryName, items]) => {
      displayCategoryItems(categoryName, items, resultsContainer);
    });
}

// New functions for range-based filtering
function displayNutritionalFilterResultsWithRange(filterKey, filteredItems, container, minValue, maxValue) {
  const filterCriteria = FILTER_CRITERIA[filterKey];
  
  // Group items by category for better organization
  const categories = {};
  filteredItems.forEach(item => {
    const category = item.CATEGORY;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });
  
  // Display items grouped by category
  Object.entries(categories).forEach(([categoryName, items]) => {
    if (items.length > 0) {
      displayCategoryItems(categoryName, items, container, filterKey);
    }
  });
}

function createRangeSlider(filterKey, parentContainer) {
  const filterCriteria = FILTER_CRITERIA[filterKey];
  const min = filterCriteria.min;
  const max = filterCriteria.max;
  const step = filterCriteria.step || 1;
  
  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('slider-container');
  sliderContainer.innerHTML = `
    <div class="range-slider">
      <input type="range" 
             id="${filterKey}-min-slider" 
             class="min-slider" 
             min="${min}" 
             max="${max}" 
             value="${min}" 
             step="${step}">
      <input type="range" 
             id="${filterKey}-max-slider" 
             class="max-slider" 
             min="${min}" 
             max="${max}" 
             value="${max}" 
             step="${step}">
      <div class="slider-track"></div>
      <div class="slider-range"></div>
    </div>
    <div class="range-values">
      <span class="min-value">${min}</span>
      <span class="max-value">${max}</span>
    </div>
    <div class="range-labels">
      <span>Min ${filterCriteria.unit}</span>
      <span>Max ${filterCriteria.unit}</span>
    </div>
  `;
  
  parentContainer.appendChild(sliderContainer);
  
  // Add event listeners for range slider interaction
  const minSlider = sliderContainer.querySelector('.min-slider');
  const maxSlider = sliderContainer.querySelector('.max-slider');
  const minValueDisplay = sliderContainer.querySelector('.min-value');
  const maxValueDisplay = sliderContainer.querySelector('.max-value');
  const rangeBar = sliderContainer.querySelector('.slider-range');
  
  function updateSliderUI() {
    const minVal = parseInt(minSlider.value);
    const maxVal = parseInt(maxSlider.value);
    
    // Ensure min doesn't exceed max
    if (minVal >= maxVal) {
      minSlider.value = maxVal - step;
    }
    
    // Ensure max doesn't go below min  
    if (maxVal <= minVal) {
      maxSlider.value = minVal + step;
    }
    
    const finalMin = parseInt(minSlider.value);
    const finalMax = parseInt(maxSlider.value);
    
    minValueDisplay.textContent = finalMin;
    maxValueDisplay.textContent = finalMax;
    
    // Update visual range bar
    const percent1 = ((finalMin - min) / (max - min)) * 100;
    const percent2 = ((finalMax - min) / (max - min)) * 100;
    
    rangeBar.style.left = percent1 + '%';
    rangeBar.style.width = (percent2 - percent1) + '%';
    
    // Apply filtering with new range
    applyCombinedFiltersWithRange(window.allMenuItemsForFiltering, activeNutritionalFilter, finalMin, finalMax);
  }
  
  minSlider.addEventListener('input', updateSliderUI);
  maxSlider.addEventListener('input', updateSliderUI);
  
  // Initial UI update
  updateSliderUI();
  
  return sliderContainer;
}

function displayCombinedFilterResultsWithRange(filteredItems, container, filterKey, minValue, maxValue) {
  // Display items for the active category with nutritional highlights
  displayCategoryItems(activeCategoryFilter, filteredItems, container, filterKey);
}

function displayNoResultsWithRange(container, filterKey, minValue, maxValue) {
  const filterCriteria = FILTER_CRITERIA[filterKey];
  
  const noResultsSection = document.createElement('div');
  noResultsSection.classList.add('no-results');
  noResultsSection.innerHTML = `
    <h3>No Results Found</h3>
    <p>No items found matching your criteria:</p>
    <ul>
      ${activeCategoryFilter ? `<li>Category: <strong>${activeCategoryFilter}</strong></li>` : ''}
      <li>${filterCriteria.name}: <strong>${minValue}-${maxValue} ${filterCriteria.unit}</strong></li>
    </ul>
    <p>Try adjusting your filters or expanding your search range.</p>
  `;
  container.appendChild(noResultsSection);
}

export { createNutritionalFilters, FILTER_CRITERIA, setCategoryFilter, clearCategoryFilter, showAllCategories };