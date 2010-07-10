function camelize (string) {
  return string.replace(/\_(.)/g, function(m, l){return l.toUpperCase()});
}

var Observable = Class.create(
{
  // --------------------- Basics -----------------------
  initialize: function()
  {
    this._properties = {};
    
    this._observers = {};
    
    this._relation_observers = {};
    
    this._current_change_observations = {};
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

  // ----------------------- KVC -----------------------
  valueForKey: function(key)
  {    
    return this[key];
  },
  
  valueForKeyPath: function(key_path)
  {
    var parser = new KeyPathParser(key_path);
    var key = parser.shift();
    
    if (parser.isEmpty())
    {
      return this.valueForKey(key);
    }
    else
    {
      return this.valueForKey(key).valueForKeyPath(parser.rest());
    }
  },
  
  setValueForKey: function(key, value)
  {
    this[key] = value;
  },
  
  setValueForKeyPath: function(key_path, value)
  {
    var parser = new KeyPathParser(key_path);
    var key = parser.shift();
    
    if (parser.isEmpty())
    {
      return this.setValueForKey(key, value);
    }
    else
    {
      return this.valueForKey(key).setValueForKeyPath(parser.rest(), value);
    }
  },
  
  // ------------------------- KVO ----------------------------
  
  willChangeValueForKey: function (key) 
  {
    var observable = this;
    this._observers[key].each(function(observer_wrapper) {
      var observation = new Observation(observer_wrapper);
      var options = $A(observation.options);
      
      observation.change.kind = 'setting';
      
      if(options.has('old'))
      {
        observation.change.old = observable.valueForKey(key);
      }
      else
      {
        observation.change.old = undefined;
      }
      
      if(options.has('prior'))
      {
        observation.change.notification_is_prior = true;
        
        observation.send(observable);
      }

      observation.change.notification_is_prior = false;        
      
      if (observable._current_change_observations[key] == null)
      {
        observable._current_change_observations[key] = [];
      }
      
      observable._current_change_observations[key].push(observation);
    })
  },
  
  didChangeValueForKey: function (key) 
  {
    var observable = this;
    $A(this._current_change_observations[key]).each(function(observation) {
      if (observation.options.has('new'))
      {
        observation.change['new'] = observable.valueForKey(key);
      }
      else
      {
        observation.change['new'] = undefined;
      }
      
      observation.send(observable);
    });
    
    this._current_change_observations[key] = [];
  },
  
  willChangeValuesAtIndexesForKey: function (change_type, indexes, key) 
  {
    
  },
  
  didChangeValuesAtIndexesForKey: function (change_type, indexes, key)
  {
    
  },
  
  addObserverForKeyPath: function(observer, key_path, options, context)
  {  
    this.addObserverWrapper(new ObserverWrapper(observer, key_path, options, context));
  },
  
  addObserverWrapper: function(observer_wrapper)
  {  
    var parser = new KeyPathParser(observer_wrapper.key_path);
    var key = parser.shift();
    
    if (parser.isEmpty())
    {
      this._observers[key].push(observer_wrapper);
      
      if ($A(observer_wrapper.options).has('initial'))
      {
        var observation = new Observation(observer_wrapper);

        observation.change.kind = 'setting';
        observation.change.old = undefined;
        observation.change.notification_is_prior = false;
        if (observation.options.has('new'))
        {
          observation.change['new'] = this.valueForKey(key);
        }
        else
        {
          observation.change['new'] = undefined;
        }

        observation.send(this);
      }
    }
    else
    {
/*      var rest = parser.rest();
      
      //Initialize the relation observer structure
      if (this._relation_observers[key] == undefined)
      {
        this._relation_observers[key] = {};
      }
      
      if (this._relation_observers[key][rest] == undefined)
      {
        this._relation_observers[key][rest] = [];
      }
      
      //Add the observer as a relation observer to us
      this._relation_observers[key][rest].push(observer_wrapper);
      
      //Register us as an observer to the immediate relation, unless we're already registered
      var options = observer_wrapper.options;
      options._kvo_update_observer = true;
      var local_observer_wrapper = new ObserverWrapper(this, rest, options);
      if (!this.valueForKey(key).hasObserverWrapper(local_observer_wrapper))
      {
        this.valueForKey(key).addObserverWrapper(local_observer_wrapper);
      } */
    }
  },
  
  removeObserverForKeyPath: function(observer, key_path) 
  {
    
  },
  
  hasObserverWrapper: function(observer_wrapper)
  {
    return false;
    
/*    var ret_1 = $H(this._observers).detect(function (key, observers) 
    {
      var ret_2 = $A(observers).detect(function (index, observer)
      {
        console.log(observer);
        return observer.equalTo(observer_wrapper);
      });
      
      return ret_2 != undefined;
    });
    
    return ret_1 != undefined;*/
  }
});

var ObserverWrapper = Class.create(
{
  initialize: function(observer, key_path, options, context) 
  {
    this.observer = observer;
    this.key_path = key_path;
    this.options = options;
    this.context = context;
//    this.custom_function = custom_function;
    
    this.current_observation = null;
    
    if (this.options == undefined)
    {
      this.options = {};
    }
  },
  equalTo: function(observer_wrapper)
  {
    if (this.observer != observer_wrapper.observer) return false;
    if (this.key_path != observer_wrapper.key_path) return false;
    if (this.options != observer_wrapper.options) return false;
    if (this.context != observer_wrapper.context) return false;
//    if (this.custom_function != observer_wrapper.custom_function) return false;
    
    return true;
  }
});

var Observation = Class.create(
{
  initialize: function(observer_wrapper) 
  {
    this.observer = observer_wrapper.observer;
    this.key_path = observer_wrapper.key_path;
    this.context = observer_wrapper.context;
    this.options = observer_wrapper.options;
    this.change = {};
  },
  send: function(sender) 
  {
    this.observer.observeValueForKeyPathOfObject(this.key_path, 
                                                 sender, 
                                                 Object.clone(this.change), 
                                                 this.context);
  }
});

var KeyPathParser = Class.create({
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
  }
});