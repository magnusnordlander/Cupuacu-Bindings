function camelize (string) {
  return string.replace(/\_(.)/g, function(m, l){return l.toUpperCase()});
}

var cbObservable = Class.create(
{
  initialize: function()
  {
    this._properties = {};
    
    this._arrays = {};
    
    this._observers = {};
    
    this._relation_observers = {};
    
    this._current_change_observations = {};
  },

  // --------------------- Properties -----------------------
  defineProperty: function(propertyName) 
  {
    this._observers[propertyName] = [];
    
    this.__defineGetter__(propertyName, function () 
    {
      if (this[camelize('get_'+propertyName)] != undefined)
      {
        return this[camelize('get_'+propertyName)]();
      }
      else if (propertyName.substr(0, 3) == 'is_' && this[camelize(propertyName)] != undefined)
      {
        return this[camelize(propertyName)]();
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
  
  defineArrayProperty: function(propertyName) 
  {
    this._arrays[propertyName] = [];
    
    this.__defineGetter__(propertyName, function () 
    {
      return this._getArray(propertyName);
    });
    
    this[camelize('object_in_'+propertyName+'_at_index')] = function(index) 
    {
      var objects = this.getObjectsAtIndexes(propertyName, [index]);
      return objects[0];
    };
    
    this[camelize(propertyName+'_at_indexes')] = function(indexes) 
    {
      return this.getObjectsAtIndexes(propertyName, indexes);
    };
    
    this[camelize('insert_object_in_'+propertyName+'_at_index')] = function(object, index) 
    {
      return this.insertObjectsAtIndexes(propertyName, [object], [index]);
    };
    
    this[camelize('insert_'+propertyName+'_at_indexes')] = function(objects, indexes) 
    {
      return this.insertObjectsAtIndexes(propertyName, objects, indexes);
    };
    
    this[camelize('add_'+propertyName)] = function(objects) 
    {
      return this.insertObjects(propertyName, objects);
    };
    
    this[camelize('remove_object_from_'+propertyName+'_at_index')] = function(index) 
    {
      return this.removeObjectsAtIndexes(propertyName, [index]);
    };
    
    this[camelize('remove_'+propertyName+'_at_indexes')] = function(indexes) 
    {
      return this.removeObjectsAtIndexes(propertyName, indexes);
    };
    
    this[camelize('replace_object_in_'+propertyName+'_at_index_with_object')] = function(index, object) 
    {
      return this.replaceObjectsAtIndexesWithObjects(propertyName, [index], [object]);
    };
    
    this[camelize('replace_'+propertyName+'_at_indexes_with_'+propertyName)] = function(indexes, objects) 
    {
      return this.replaceObjectsAtIndexesWithObjects(propertyName, indexes, objects);
    };
    
    this[camelize('count_of_'+propertyName)] = function() 
    {
      return this.countObjects(propertyName);
    };
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

  _getArray: function(key) 
  {
    return this._arrays[key];
  },

  getObjectsAtIndexes: function(key, indexes)
  {
    var observable = this;
    return indexes.collect(function(index) 
    {
      return observable._arrays[key][index];
    });
  },

  insertObjectsAtIndexes: function(key, objects, indexes)
  {
    var observable = this;
    indexes.zip(objects, function(tuple) 
    {
      observable._arrays[key].splice(tuple[0], 0, tuple[1]);
    });
  },
  
  insertObjects: function(key, objects)
  {
    var observable = this;
    objects.each(function(obj) 
    {
      observable._arrays[key].push(obj);
    });
  },
  
  removeObjectsAtIndexes: function(key, indexes) 
  {
    var sorted_indexes = indexes.sort(function(a, b) 
    {
      return b-a;
    });
    
    var observable = this;
    sorted_indexes.each(function(index) 
    {
      observable._arrays[key].splice(index, 1);
    });
  },
  
  replaceObjectsAtIndexesWithObjects: function(key, indexes, objects)
  {
    var observable = this;
    indexes.zip(objects, function(tuple) 
    {
      observable._arrays[key].splice(tuple[0], 1, tuple[1]);
    });
  },
  
  countObjects: function(key)
  {
    return this._arrays[key].length;
  },

  // ----------------------- KVC -----------------------
  valueForKey: function(key)
  {    
    return this[key];
  },
  
  valueForKeyPath: function(key_path)
  {
    var parser = new cbKeyPathParser(key_path);
    var key = parser.shift();

    if (key == 'self')
    {
      return this.valueForKeyPath(parser.rest());
    }
    
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
    var parser = new cbKeyPathParser(key_path);
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
      var observation = new cbObservation(observer_wrapper);
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
    this.addObserverWrapper(new cbObserverWrapper(observer, key_path, options, context));
  },
  
  addObserverWrapper: function(observer_wrapper)
  {  
    var parser = new cbKeyPathParser(observer_wrapper.key_path);
    var key = parser.shift();
    
    if (parser.isEmpty())
    {
      this._observers[key].push(observer_wrapper);
      
      if ($A(observer_wrapper.options).has('initial'))
      {
        var observation = new cbObservation(observer_wrapper);

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

var cbObserverWrapper = Class.create(
{
  initialize: function(observer, key_path, options, context) 
  {
    this.observer = observer;
    this.key_path = key_path;
    this.options = options;
    this.context = context;
    
    if (options == undefined)
    {
      this.options = [];
    }
  },
  equalTo: function(observer_wrapper)
  {
    if (this.observer != observer_wrapper.observer) return false;
    if (this.key_path != observer_wrapper.key_path) return false;
    if (this.options != observer_wrapper.options) return false;
    if (this.context != observer_wrapper.context) return false;
    
    return true;
  }
});

var cbObservation = Class.create(
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