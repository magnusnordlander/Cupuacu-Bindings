var ElementUpdater = Class.create(
{
  initialize: function(element) 
  {
    this.element = element;
  },
  update: function(value) 
  {
    if (window.console && window.console.error)
    {
      window.console.error("Attempted to use abstract element updater");
    }
  },
  observeValueForKeyPathOfObject: function(key_path, object, options, context)
  {
    this.update(object.valueForKey(key_path));
  }
});

var TextElementUpdater = Class.create(ElementUpdater, 
{
  update: function(value) 
  {
    this.element.update(value);
  }
});

var FormElementUpdater = Class.create(ElementUpdater, 
{
  update: function(value) 
  {
    this.element.setValue(value);
  }
});