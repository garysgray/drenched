class UIComponent 
{
  constructor() 
  {
    if (this.constructor === UIComponent) 
    {
      throw new TypeError("Cannot instantiate abstract class UIComponent directly.");
    }
  }

  /**
   * Must return the array configuration checklist of element mappings.
   */
  getEventMaps() 
  {
    throw new Error("Method 'getEventMaps()' must be implemented by subclass.");
  }

  /**
   * Must handle receiving unified incoming state broadcasts.
   */
  updateVisualState(actionType, value) 
  {
    throw new Error("Method 'updateVisualState()' must be implemented by subclass.");
  }
}
