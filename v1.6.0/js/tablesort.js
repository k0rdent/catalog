document$.subscribe(function() {
  var tables = document.querySelectorAll("article table:not([data-sort='false'])")
  tables.forEach(function(table) {
    new Tablesort(table)
  })
})
