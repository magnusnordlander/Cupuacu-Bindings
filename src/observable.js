function camelize (string) {
	return string.replace(/\_(.)/g, function(m, l){return l.toUpperCase()});
}

var Observable = Class.create({
	initialize: function()
	{
		this._properties = {};
		
		this._observers = {};
	},
	
	defineProperty: function(propertyName) 
	{
		this._observers[propertyName] = [];
		
		this.__defineGetter__(propertyName, function () 
		{
			if (this[camelize('get_'+propertyName)] != undefined)
			{
				return this[camelize('get_'+propertyName)]();
			}
			else
			{
				return this._get(propertyName);
			}
		});
		
		this.__defineSetter__(propertyName, function (val) 
		{
			if (this[camelize('set_'+propertyName)] != undefined)
			{
				return this[camelize('set_'+propertyName)](val);
			}
			else
			{
				return this._set(propertyName, val);
			}
		});
	},
	
	_get: function(key)
	{
		return this._properties[key];
	},
	
	// Set value and notify of the change
	_set: function(key, value)
	{
		this.willChangeValueForKey(key);
		this.__set(key, value);
		this.didChangeValueForKey(key);
	},

	// Set value without notifying
	__set: function(key, value)
	{
		this._properties[key] = value;
	},
	
	valueForKey: function(key_path)
	{
		if (!(key_path instanceof KeyPath))
		{
			key_path = new KeyPath(key_path);
		}
		
		return this[key_path.getLastComponent()];
	},
	
	willChangeValueForKey: function (key) 
	{

	},
	
	didChangeValueForKey: function (key) 
	{
		var observable = this;
		this._observers[key].each(function(observer_wrapper) {
			observer_wrapper.observer.observeValueForKeyPathOfObject(key, observable, null, observer_wrapper.context);
		});
	},
	
	willChangeValuesAtIndexesForKey: function (change_type, indexes, key) 
	{
		
	},
	
	didChangeValuesAtIndexesForKey: function (change_type, indexes, key)
	{
		
	},
	
	addObserverForKeyPath: function(observer, key_path, options, context)
	{
		if (!(key_path instanceof KeyPath))
		{
			key_path = new KeyPath(key_path);
		}
		
		this._observers[key_path.getComponentAtIndex(0)].push(new ObserverWrapper(observer, options, context));
	},
	
	removeObserverForKeyPath: function(observer, key_path) 
	{
		
	}
});

var ObserverWrapper = Class.create({
	initialize: function(observer, options, context) {
		this.observer = observer;
		this.options = options;
		this.context = context;
	}
});

var KeyPath = Class.create({
	initialize: function(key_path) {
		this.paths = key_path.split('.');
	},
	getComponentAtIndex: function(index)
	{
		return this.paths[index];
	},
	getLastComponent: function()
	{
		return this.paths[this.paths.length-1];
	},
	isMultiComponent: function(index)
	{
		return (this.paths.length == 1);
	}
});