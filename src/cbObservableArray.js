var cbObservableArray = Class.create(Enumerable, 
{
  initialize: function() 
  {
    this._array = [];
  },
  
  withinBounds: function(index)
  {
    return (this._array.length > index && index >= 0);
  },
  
  withinBoundsForInsert: function(index)
  {
    return (this._array.length >= index && index >= 0);
  },
  
  insertObject: function(obj)
  {
    this._array.push(obj);
  },
  
  insertObjectAtIndex: function(obj, index)
  {
    if (!this.withinBoundsForInsert(index))
    {
      throw new cbOutOfBoundsException();
    }
    
    this._array.splice(index, 0, obj);
  },
  
  getObjectAtIndex: function(index)
  {
    if (!this.withinBounds(index))
    {
      throw new cbOutOfBoundsException();
    }
    
    return this._array[index];
  },
  
  removeObjectAtIndex: function(index)
  {
    if (!this.withinBounds(index))
    {
      throw new cbOutOfBoundsException();
    }
    
    this._array.splice(index, 1);
  },
  
  replaceObjectAtIndex: function(index, obj)
  {
    if (!this.withinBounds(index))
    {
      throw new cbOutOfBoundsException();
    }
    
    this._array.splice(index, 1, obj);
  },
  
  count: function()
  {
    return this._array.length;
  }
});

var cbOutOfBoundsException = Class.create(
{
  initialize: function() {
    
  }
});