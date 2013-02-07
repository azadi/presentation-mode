this.addEventListener("click", function(event) {
  if (event.button === 0 || event.button === 2) {
    self.port.emit("activate");
  } 
}, true);
