(function() {
  var items = document.querySelectorAll('.timeline-item');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var counter = document.getElementById('lightboxCounter');
  var currentIndex = -1;
  var itemsArray = Array.from(items);

  if (items.length === 0) return;

  itemsArray.forEach(function(item, i) {
    item.addEventListener('click', function() { open(i); });
  });

  document.querySelector('.lightbox-close').addEventListener('click', close);
  document.querySelector('.lightbox-prev').addEventListener('click', prev);
  document.querySelector('.lightbox-next').addEventListener('click', next);

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function(e) {
    if (currentIndex === -1) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  function open(i) {
    currentIndex = i;
    var item = itemsArray[i];
    var src = item.dataset.original;
    var ver = item.dataset.version || '0';
    lightboxImg.src = src + '?v=' + ver;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCounter();
  }

  function close() {
    lightbox.classList.remove('active');
    lightboxImg.src = '';
    document.body.style.overflow = '';
    currentIndex = -1;
  }

  function prev() {
    if (currentIndex > 0) open(currentIndex - 1);
  }

  function next() {
    if (currentIndex < itemsArray.length - 1) open(currentIndex + 1);
  }

  function updateCounter() {
    counter.textContent = (currentIndex + 1) + ' / ' + itemsArray.length;
  }
})();
