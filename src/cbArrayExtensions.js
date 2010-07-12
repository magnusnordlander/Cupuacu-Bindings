Object.extend(Array.prototype, 
{
  has: function(ent)
  {
    return (this.indexOf(ent) != -1);
  },

	valueForKey: function(key)
	{
		switch (key)
		{
			case '@count':
				return this.length;
			case '@avg':
				return (this.inject(0, function(sum, item) 
				{
					return sum + item;
				}) / this.length);
			case '@min':
				return this.min();
			case '@max':
				return this.max();
			case '@sum':
				return this.inject(0, function(sum, item) 
				{
					return sum + item;
				});
			default:
				return undefined;
		}
	},
	
	valueForKeyPath: function(key_path)
	{
		var parser = new cbKeyPathParser(key_path);
    var key = parser.shift();

		if (key == 'self')
		{
			return this.valueForKeyPath(parser.rest());
		}

		parser.clearSelves();
		
		if (parser.isEmpty())
		{
			return this.valueForKey(key);
		}
		
		var rest = parser.rest();
    
		switch (key)
		{
			case '@count':
				return this.length;
			case '@avg':
				return (this.inject(0, function(sum, item) 
				{
					return sum + item.valueForKeyPath(rest);
				}) / this.length);
			case '@min':
				return this.min(function(item) 
				{
					return item.valueForKeyPath(rest);
				});
			case '@max':
				return this.max(function(item) 
				{
					return item.valueForKeyPath(rest);
				});
			case '@sum':
				return this.inject(0, function(sum, item) 
				{
					return sum + item.valueForKeyPath(rest);
				});
			default:
				return undefined;
		}
	}
});