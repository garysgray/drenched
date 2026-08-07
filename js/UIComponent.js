// ──────────────────────────────────────────────────────────────
// ── UIComponent ────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
//
// Abstract base blueprint for all user interface modules.
// Enforces a strict architectural contract for structural decoupling.
//
// Depends on: None
//
// Why this exists:
// The UIComponent class acts as the universal template for all layout systems.
// It requires child classes to implement standard inbound and outbound corridors,
// ensuring the UIManager can handle traffic without knowing individual details.

class UIComponent 
{
  constructor() 
  {
    // Defensive Check: Prevent direct instantiation of this abstract class
    if (this.constructor === UIComponent) 
    {
      throw new TypeError("Cannot instantiate abstract class UIComponent directly.");
    }
  }

  // Returns array configuration checklist of element mappings
  getEventMaps() 
  {
    throw new Error("Method 'getEventMaps()' must be implemented by subclass.");
  }

  // Handles receiving unified incoming state broadcasts from UIManager
  updateVisualState(actionType, value) 
  {
    throw new Error("Method 'updateVisualState()' must be implemented by subclass.");
  }
}
