var cbKeyPathParser = Class.create({
  initialize: function(key_path) 
  {
    this.key_path_array = key_path.split('.');
  },
  shift: function() 
  {
    return this.key_path_array.shift();
  },
  rest: function()
  {
    return this.key_path_array.join('.');
  },
  isEmpty: function()
  {
    return (this.key_path_array.length == 0);
  },
  read: function()
  {
    if (this.isEmpty())
    {
      return undefined;
    }
    return this.key_path_array[0];
  },
  clearSelves: function()
  {
    while (!this.isEmpty() && this.read() == 'self')
    {
      this.shift();
    }
  }
});