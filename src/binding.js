var Binding = Behavior.create({
  initialize : function() {
    //var updater = this.getUpdater();
    var updater = new TextElementUpdater(this);
  }
});