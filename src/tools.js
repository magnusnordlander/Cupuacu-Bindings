Object.extend(Array.prototype, {
  has: function(ent)
  {
    return (this.indexOf(ent) != -1);
  }
});