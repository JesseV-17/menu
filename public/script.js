/**
 * MANAGER VIEW - SCRIPT.JS
 * Handles CRUD operations for McDonald's menu items in the manager interface
 * Includes form handling, data parsing, filtering, and API communication
 */

// === DOM ELEMENT REFERENCES ===
// Get references to key elements on the page
let myForm = document.querySelector('#myForm')  // The form for adding/editing items
let contentArea = document.querySelector('#contentArea')  // Container for displaying menu items
let formPopover = document.querySelector('#formPopover')  // The popup form overlay
let createButton = document.querySelector('#createButton')  // Button to create new items
let formHeading = document.querySelector('#formPopover h2')  // Form title (changes for add/edit)
let searchInput = document.querySelector('#searchInput')  // Search box for filtering items
let categoryFilter = document.querySelector('#categoryFilter')  // Category dropdown filter

// === GLOBAL STATE ===
// Store all items for filtering
let allItems = []

// === TOAST NOTIFICATION SYSTEM ===
/**
 * Display a temporary notification message
 * @param {string} message - The message to display in the toast
 */
const showToast = (message) => {
    const toast = document.getElementById('toast')
    toast.textContent = message
    toast.classList.add('show')  // Show the toast
    
    // Hide the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show')
    }, 3000)
}

// === FORM DATA EXTRACTION ===
/**
 * Extract and process form data, converting strings to appropriate types
 * Handles checkboxes (boolean), numbers (string/null), dates (ISO format), and text fields
 * @returns {Object} Form data as JSON with properly typed values
 */
const getFormData = () => {
    // FormData gives a baseline representation of the form
    // with all fields represented as strings
    const formData = new FormData(myForm)
    const json = Object.fromEntries(formData)

    // Handle checkboxes, dates, and numbers
    myForm.querySelectorAll('input').forEach(el => {
        const value = json[el.name]
        
        // Skip processing for hidden inputs (like id field)
        if (el.type === 'hidden') {
            return
        }
        
        const isEmpty = !value || value.trim() === ''

        // Represent checkboxes as a Boolean value (true/false)
        if (el.type === 'checkbox') {
            json[el.name] = el.checked
        }
        // Keep number and range inputs as strings to match Prisma schema
        // Set to null if empty
        else if (el.type === 'number' || el.type === 'range') {
            json[el.name] = isEmpty ? null : value
        }
        // Represent all date inputs in ISO-8601 DateTime format
        else if (el.type === 'date') {
            json[el.name] = isEmpty ? null : new Date(value).toISOString()
        }
        // Handle regular text inputs - set to null if empty
        else if (isEmpty && el.type === 'text') {
            json[el.name] = null
        }
    })

    // Handle select dropdowns - set to null if empty
    myForm.querySelectorAll('select').forEach(el => {
        const value = json[el.name]
        if (!value || value.trim() === '') {
            json[el.name] = null
        }
    })
    
    return json
}


// === FORM SUBMISSION HANDLER ===
/**
 * Listen for form submissions
 * Prevent page reload, extract form data, save to database, and close form
 */
myForm.addEventListener('submit', async event => {
    // prevent the page from reloading when the form is submitted.
    event.preventDefault()
    const data = getFormData()
    await saveItem(data)
    myForm.reset()
    formPopover.hidePopover()
})


// === SAVE ITEM (CREATE OR UPDATE) ===
/**
 * Save a menu item to the database via API
 * Handles both creating new items (POST) and updating existing items (PUT)
 * @param {Object} data - The menu item data to save
 */
const saveItem = async (data) => {
    console.log('Saving:', data)

    // Determine if this is an update or create based on presence of ID
    const endpoint = data.id ? `/data/${data.id}` : '/data'
    const method = data.id ? "PUT" : "POST"

    const options = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    try {
        const response = await fetch(endpoint, options)

        if (!response.ok) {
            try {
                const errorData = await response.json()
                console.error('Error:', errorData)
                const errorMessage = errorData.details || errorData.error || response.statusText
                alert('Failed to save: ' + errorMessage)
            }
            catch (err) {
                console.error(response.statusText)
                alert('Failed to save: ' + response.statusText)
            }
            return
        }

        const result = await response.json()
        console.log('Saved:', result)
        showToast('Menu item saved successfully!')

        // Refresh the data list to show the new/updated item
        getData()
    }
    catch (err) {
        console.error('Save error:', err)
        alert('An error occurred while saving')
    }
}


// === EDIT ITEM ===
/**
 * Populate the form with existing item data for editing
 * Opens the form popover in edit mode
 * @param {Object} data - The menu item data to edit
 */
const editItem = (data) => {
    console.log('Editing:', data)

    // Populate the form with data to be edited
    Object.keys(data).forEach(field => {
        const element = myForm.elements[field]
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[field]
            } else if (element.type === 'date') {
                // Extract yyyy-mm-dd from ISO date string (avoids timezone issues)
                element.value = data[field] ? data[field].substring(0, 10) : ''
            } else {
                element.value = data[field]
            }
        }
    })

    // Update the heading to indicate edit mode
    formHeading.textContent = 'Edit Menu Item'

    // Show the popover
    formPopover.showPopover()
}

// === DELETE ITEM ===
/**
 * Delete a menu item from the database after user confirmation
 * Shows a modal dialog for confirmation before deleting
 * @param {string} id - The ID of the item to delete
 */
const deleteItem = async (id) => {
    const modal = document.getElementById('deleteModal')
    const confirmBtn = document.getElementById('confirmDelete')
    const cancelBtn = document.getElementById('cancelDelete')
    
    // Show confirmation modal
    modal.classList.add('show')
    
    // Handle confirmation - user clicks "Delete"
    const handleConfirm = async () => {
        modal.classList.remove('show')
        confirmBtn.removeEventListener('click', handleConfirm)
        cancelBtn.removeEventListener('click', handleCancel)
        
        const endpoint = `/data/${id}`
        const options = { method: "DELETE" }

        try {
            const response = await fetch(endpoint, options)

            if (response.ok) {
                const result = await response.json()
                console.log('Deleted:', result)
                showToast('Item deleted successfully')
                // Refresh the data list to remove the deleted item
                getData()
            }
            else {
                const errorData = await response.json()
                alert(errorData.error || 'Failed to delete item')
            }
        } catch (error) {
            console.error('Delete error:', error)
            alert('An error occurred while deleting')
        }
    }
    
    // Handle cancel - user clicks "Cancel"
    const handleCancel = () => {
        modal.classList.remove('show')
        confirmBtn.removeEventListener('click', handleConfirm)
        cancelBtn.removeEventListener('click', handleCancel)
    }
    
    // Attach event listeners to modal buttons
    confirmBtn.addEventListener('click', handleConfirm)
    cancelBtn.addEventListener('click', handleCancel)
}

// === CALENDAR WIDGET (UNUSED) ===
/**
 * Create a calendar widget display for a date
 * @param {string} date - ISO date string
 * @returns {string} HTML string for calendar widget
 */
const calendarWidget = (date) => {
    if (!date) return ''
    const month = new Date(date).toLocaleString("en-CA", { month: 'short', timeZone: "UTC" })
    const day = new Date(date).toLocaleString("en-CA", { day: '2-digit', timeZone: "UTC" })
    const year = new Date(date).toLocaleString("en-CA", { year: 'numeric', timeZone: "UTC" })
    return ` <div class="calendar">
                <div class="born"><img src="./assets/birthday.svg" /></div>
                <div class="month">${month}</div>
                <div class="day">${day}</div> 
                <div class="year">${year}</div>
            </div>`

}

// === RENDER ITEM CARD ===
/**
 * Create an HTML element for displaying a menu item card
 * Parses item name to extract and display weight information separately
 * Supports multiple weight formats: fl oz, oz, grams, cookies
 * @param {Object} item - Menu item object from database
 * @returns {HTMLElement} Div element containing the rendered item card
 */
const renderItem = (item) => {
    const div = document.createElement('div')
    div.classList.add('item-card')
    div.setAttribute('data-id', item.id)

    // === WEIGHT PARSING LOGIC ===
    // Parse item name to extract weight information and display it separately
    let itemName = item.ITEM || 'Unnamed Item'
    let weightInfo = ''
    const category = item.CATEGORY || ''
    
    // Try multiple patterns in order of specificity
    
    // Pattern 1: Match "X fl oz cup (Y g)" - e.g., "12 fl oz cup (310 g)"
    // For beverages with both fl oz and grams
    let pattern = /(\d+\.?\d*)\s*fl\s*oz\s*cup\s*\(\d+\s*g\)/i
    let match = itemName.match(pattern)
    if (match) {
        const flOz = match[1]
        itemName = itemName.replace(pattern, '').trim()
        weightInfo = `<div class="weight-info">${flOz} fl oz</div>`
    }
    
    // Pattern 2: Match "(X fl oz cup)" - e.g., "(12 fl oz cup)"
    // For beverages with fl oz in parentheses
    if (!weightInfo) {
        pattern = /\((\d+\.?\d*)\s*fl\s*oz\s*cup\)/i
        match = itemName.match(pattern)
        if (match) {
            const flOz = match[1]
            itemName = itemName.replace(pattern, '').trim()
            weightInfo = `<div class="weight-info">${flOz} fl oz</div>`
        }
    }
    
    // Pattern 3: Match "X fl oz" - e.g., "22 fl oz"
    // For beverages with standalone fl oz
    if (!weightInfo) {
        pattern = /(\d+\.?\d*)\s*fl\s*oz/i
        match = itemName.match(pattern)
        if (match) {
            const flOz = match[1]
            itemName = itemName.replace(pattern, '').trim()
            weightInfo = `<div class="weight-info">${flOz} fl oz</div>`
        }
    }
    
    // Pattern 4: Match "X oz (Y g)" - e.g., "8.9 oz (251 g)"
    // For items with both oz and grams - show oz for beverages, grams for food
    if (!weightInfo) {
        pattern = /(\d+\.?\d*)\s*oz\s*\((\d+)\s*g\)/i
        match = itemName.match(pattern)
        if (match) {
            const ounces = match[1]
            const grams = match[2]
            itemName = itemName.replace(pattern, '').trim()
            
            // For beverages, show ounces; for food items, show grams (more precise)
            if (category === 'DESSERTSHAKE' || category === 'CONDIMENT' || category === 'BEVERAGE') {
                weightInfo = `<div class="weight-info">${ounces} oz</div>`
            } else {
                weightInfo = `<div class="weight-info">${grams} g</div>`
            }
        }
    }
    
    // Pattern 5: Match "X cookie (Y g)" - e.g., "1 cookie (33 g)"
    // Special case for cookies with weight
    if (!weightInfo) {
        pattern = /\d+\s*cookie\s*\((\d+\.?\d*)\s*g\)/i
        match = itemName.match(pattern)
        if (match) {
            const grams = match[1]
            itemName = itemName.replace(pattern, '').trim()
            weightInfo = `<div class="weight-info">${grams} g</div>`
        }
    }
    
    // Pattern 6: Match standalone "(X g)" or "X g" - only for non-beverage items
    // For food items with grams only (not beverages)
    if (!weightInfo && category !== 'DESSERTSHAKE' && category !== 'CONDIMENT' && category !== 'BEVERAGE') {
        pattern = /\(?\s*(\d+\.?\d*)\s*g\s*\)?/i
        match = itemName.match(pattern)
        if (match) {
            const grams = match[1]
            itemName = itemName.replace(pattern, '').trim()
            weightInfo = `<div class="weight-info">${grams} g</div>`
        }
    }

    // === BUILD ITEM CARD HTML ===
    // Create the HTML template for the item card with nutrition facts
    const template = /*html*/`  
    <div class="item-actions">
        <img src="./assets/edit.svg" alt="Edit" class="action-icon edit-icon" />
        <img src="./assets/trash.svg" alt="Delete" class="action-icon delete-icon" />
    </div>
    <div class="category-badge">
        ${item.CATEGORY || 'N/A'}
    </div>
    <h3>${itemName}</h3>
    ${weightInfo}
    <div class="item-info"> 
        <div class="nutrition-facts">
            <h4>Nutrition Facts</h4>
            <div class="nutrition-grid">
                ${item.CAL ? `<div class="nutrition-item"><span>Calories:</span> <strong>${item.CAL}</strong></div>` : ''}
                ${item.FAT ? `<div class="nutrition-item"><span>Total Fat:</span> <strong>${item.FAT}g</strong></div>` : ''}
                ${item.SFAT ? `<div class="nutrition-item"><span>Saturated Fat:</span> <strong>${item.SFAT}g</strong></div>` : ''}
                ${item.TFAT ? `<div class="nutrition-item"><span>Trans Fat:</span> <strong>${item.TFAT}g</strong></div>` : ''}
                ${item.CHOL ? `<div class="nutrition-item"><span>Cholesterol:</span> <strong>${item.CHOL}mg</strong></div>` : ''}
                ${item.SALT ? `<div class="nutrition-item"><span>Sodium:</span> <strong>${item.SALT}mg</strong></div>` : ''}
                ${item.CARB ? `<div class="nutrition-item"><span>Carbohydrates:</span> <strong>${item.CARB}g</strong></div>` : ''}
                ${item.FBR ? `<div class="nutrition-item"><span>Fiber:</span> <strong>${item.FBR}g</strong></div>` : ''}
                ${item.SGR ? `<div class="nutrition-item"><span>Sugar:</span> <strong>${item.SGR}g</strong></div>` : ''}
                ${item.PRO ? `<div class="nutrition-item"><span>Protein:</span> <strong>${item.PRO}g</strong></div>` : ''}
            </div>
        </div>
    </div>
    `
    // Sanitize HTML to prevent XSS attacks
    div.innerHTML = DOMPurify.sanitize(template);

    // Add event listeners to action icons
    div.querySelector('.edit-icon').addEventListener('click', () => editItem(item))
    div.querySelector('.delete-icon').addEventListener('click', () => deleteItem(item.id))

    return div
}

// === FILTER AND DISPLAY ITEMS ===
/**
 * Filter items based on search term and category selection
 * Display the filtered results in the content area
 */
const filterAndDisplayItems = () => {
    const searchTerm = searchInput.value.toLowerCase().trim()
    const selectedCategory = categoryFilter.value

    // Filter items by both search term and category
    const filteredItems = allItems.filter(item => {
        // Filter by search term - check if item name contains the search
        const matchesSearch = !searchTerm || 
            (item.ITEM && item.ITEM.toLowerCase().includes(searchTerm))
        
        // Filter by category - check if item matches selected category
        const matchesCategory = !selectedCategory || item.CATEGORY === selectedCategory
        
        // Item must match both criteria
        return matchesSearch && matchesCategory
    })

    // Display filtered items or show "no results" message
    contentArea.innerHTML = ''
    if (filteredItems.length === 0) {
        contentArea.innerHTML = '<p><i>No items match your search.</i></p>'
    } else {
        filteredItems.forEach(item => {
            const itemDiv = renderItem(item)
            contentArea.appendChild(itemDiv)
        })
    }
}

// === FETCH DATA FROM API ===
/**
 * Fetch all menu items from the API endpoint
 * Store items in global state and display them
 */
const getData = async () => {
    console.log('getData() called - fetching menu items...')
    try {
        const response = await fetch('/data')

        if (response.ok) {
            const data = await response.json()
            console.log('Fetched data:', data)
            console.log('Number of items:', data.length)

            if (data.length == 0) {
                contentArea.innerHTML = '<p><i>No data found in the database.</i></p>'
                return
            }
            else {
                // Store items globally for filtering
                allItems = data
                filterAndDisplayItems()
            }
        }
        else {
            // If the request failed, hide the create button
            createButton.style.display = 'none'
            contentArea.innerHTML = '<p>Could not connect to the database.</p>'
        }
    } catch (error) {
        console.error('Error fetching data:', error)
        contentArea.innerHTML = '<p>Error loading menu items.</p>'
    }
}

// === EVENT LISTENERS ===

// Revert to the default form title when form is reset
myForm.addEventListener('reset', () => formHeading.textContent = '🍔 Add Menu Item')

// Reset the form when the create button is clicked (starts fresh)
createButton.addEventListener('click', () => myForm.reset())

// Handle cancel button click - close form without saving
const cancelButton = document.querySelector('button.cancel')
cancelButton.addEventListener('click', () => {
    myForm.reset()
    formPopover.hidePopover()
})

// Add search input listener - filter items as user types
searchInput.addEventListener('input', filterAndDisplayItems)

// Add category filter listener - filter items when category changes
categoryFilter.addEventListener('change', filterAndDisplayItems)

// === INITIALIZATION ===
// Load initial data when page loads
getData()
