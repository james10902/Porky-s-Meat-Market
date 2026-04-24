# Porky's Meat Market Platform - Development Guidelines

## Project Overview

This is a vanilla JavaScript web platform (HTML5, CSS3, ES6+) for Porky's Meat Market. It's a multi-page application (MPA) enhanced with dynamic JavaScript rendering, designed for high performance on low-bandwidth networks.

## Architecture Principles

1. **No Frameworks**: Pure vanilla JavaScript with modular organization
2. **Lightweight**: Minimal dependencies, ~50KB JS total
3. **Modular**: Each feature has its own module with clear responsibilities
4. **Progressive Enhancement**: Works without JavaScript, enhanced with it
5. **Performance First**: Target <3 seconds load on 3G

## Code Organization

### File Structure Rules

```
/css           → All stylesheets (design-system, components, pages)
/js
  /utils       → Helper functions (DOM utilities)
  /services    → API layer, business logic
  /modules     → Feature modules (cart, auth, products, etc.)
/pages         → Additional HTML pages
/public        → Static assets (images, fonts)
```

### Naming Conventions

- **CSS Classes**: kebab-case (`.product-card`, `.btn-primary`)
- **JavaScript Variables**: camelCase (`productId`, `currentUser`)
- **JavaScript Constants**: UPPER_SNAKE_CASE (`STORAGE_KEY`, `API_TIMEOUT`)
- **Module Names**: PascalCase in comments, lowercase in files (`Cart`, `Auth`)
- **Event Names**: Prefixed with namespace (`cart:updated`, `auth:loggedIn`)

## Module Development

### Creating a New Module

1. Create file in `/js/modules/moduleName.js`
2. Use IIFE or Object pattern for scope
3. Export module at bottom with module.exports check
4. Initialize on DOM ready

```javascript
// Template
const ModuleName = {
  // State
  state: {},

  // Initialize
  init: () => {
    // Setup
  },

  // Public methods
  method: () => {},

  // Private helper (prefix with _)
  _helper: () => {}
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleName;
}
```

### Module Responsibilities

- **api.js**: All backend communication (no DOM manipulation)
- **dom.js**: DOM queries and manipulation (no business logic)
- **auth.js**: User authentication and session
- **cart.js**: Shopping cart management (localStorage)
- **theme.js**: Dark/light mode switching
- **products.js**: Product catalog rendering and filtering
- **dashboard.js**: User dashboard and account management
- **home.js**: Home page specific features

## CSS Guidelines

### Design System Usage

All colors, spacing, fonts should use CSS variables from `design-system.css`:

```css
/* ✓ Good */
background-color: var(--color-amber);
padding: var(--spacing-lg);

/* ✗ Avoid */
background-color: #FFC107;
padding: 24px;
```

### Component Styling

- Prefix component styles with component name (`.button-primary`, `.card-header`)
- Use BEM naming for complex components
- Keep component styles scoped to their file
- Reuse generic utility classes

### Responsive Design

- Mobile-first approach
- Breakpoint at 768px for tablets/desktop
- Test all components at multiple sizes

## JavaScript Patterns

### Event Handling

```javascript
// ✓ Using DOM utility
DOM.on(element, 'click', () => {
  // Handler
});

// ✓ Event delegation
DOM.delegate(parent, 'click', '.item', () => {
  // Handler
});

// ✗ Avoid inline onclick where possible
<button onclick="handler()"></button>
```

### API Calls

```javascript
// ✓ Use API service
const products = await API.products.getAll();

// ✗ Direct fetch
const res = await fetch('/api/products');
```

### Error Handling

```javascript
// ✓ Try-catch with meaningful messages
try {
  const data = await API.someCall();
} catch (error) {
  console.error('Context: ' + error.message);
  showUserMessage('Failed to load data');
}
```

### State Management

```javascript
// ✓ Use localStorage for persistence
localStorage.setItem('key', JSON.stringify(data));

// ✓ Use events for state changes
Module.emit('stateChanged', { data });

// ✗ Don't use global variables
window.globalState = {}; // ✗ Bad
```

## Performance Checklist

- [ ] Images use lazy loading (`loading="lazy"`)
- [ ] Scripts use `defer` attribute
- [ ] No render-blocking CSS
- [ ] CSS variables instead of inline styles
- [ ] Minimal DOM manipulation
- [ ] Event listeners properly cleaned up
- [ ] localStorage used for caching
- [ ] No console.log in production code

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Avoid:
- ES2021+ features
- CSS Grid subgrid
- Fetch without polyfill

## Security Best Practices

1. **Always sanitize user input**
   ```javascript
   DOM.sanitizeHTML(userInput); // Not just textContent
   ```

2. **Never trust user data**
   - Validate on frontend and backend
   - Sanitize all outputs

3. **Auth token security**
   - Store in localStorage for now (consider httpOnly cookies)
   - Send in Authorization header
   - Clear on logout

4. **API calls**
   - HTTPS only in production
   - Implement rate limiting
   - Return minimal data (no passwords)

## Testing Guidelines

### Manual Testing Checklist

- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Test with JS disabled (if applicable)
- [ ] Test with slow network (DevTools throttling)
- [ ] Test in multiple browsers
- [ ] Test keyboard navigation
- [ ] Test with screen reader if applicable

### Performance Testing

- Chrome DevTools Lighthouse
- Network tab for load times
- Performance tab for rendering
- Test on low-end Android device if possible

## Git Workflow

### Commit Messages

```
feat: Add product search functionality
fix: Correct cart total calculation
docs: Update API documentation
style: Align button spacing
refactor: Simplify cart module
test: Add cart tests
```

### Branch Naming

- `feature/short-description`
- `bugfix/short-description`
- `docs/short-description`

## Common Tasks

### Adding a New Product Property

1. Update product mock data in `products.js`
2. Update product card template in rendering function
3. Update API types in `api.js` if needed
4. Add to product database schema

### Implementing New Order Status

1. Add status constant in `dashboard.js`
2. Update `getStatusLabel()` function
3. Update tracking step indicator styles
4. Update backend order model

### Adding New Page

1. Create HTML file with navigation
2. Link CSS files (design-system, components, page-specific)
3. Include module scripts with `defer`
4. Create corresponding module if needed
5. Test responsive layout

## Troubleshooting Common Issues

### Page not loading styles
- Check CSS file paths are relative to HTML location
- Verify CSS is linked before scripts
- Check browser dev tools for 404 errors

### Cart not persisting
- Verify localStorage is enabled
- Check STORAGE_KEY spelling
- Test in browser console: `localStorage.getItem('porky_cart')`

### API calls failing
- Check backend is running
- Verify CORS headers
- Check Authorization header format
- Review API endpoint paths

### Animations not working
- Check CSS transitions/animations are defined
- Verify classes are being added/removed
- Check z-index conflicts
- Use `will-change` for expensive animations

## Deployment Checklist

- [ ] Remove all console.log statements
- [ ] Minify CSS and JavaScript
- [ ] Optimize images (use WebP with fallback)
- [ ] Set proper cache headers
- [ ] Enable gzip compression
- [ ] Test on staging environment
- [ ] Verify SSL certificate
- [ ] Check SEO meta tags
- [ ] Test on target network conditions
- [ ] Set up error monitoring
- [ ] Document environment variables

## Resources

- [MDN Web Docs](https://developer.mozilla.org)
- [CSS Tricks](https://css-tricks.com)
- [JavaScript.info](https://javascript.info)
- [Can I use](https://caniuse.com)

## Support & Questions

Contact the development team for:
- Architecture decisions
- Performance concerns
- Security issues
- Cross-browser problems

---

**Last Updated**: April 23, 2026
**Maintained by**: Porky's Development Team
