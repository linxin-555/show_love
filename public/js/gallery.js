(function() {
  var items = document.querySelectorAll('.timeline-item');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var counter = document.getElementById('lightboxCounter');
  var descText = document.getElementById('lightboxDesc');
  var descInput = document.getElementById('lightboxDescInput');
  var currentIndex = -1;
  var itemsArray = Array.from(items);

  if (items.length === 0) return;

  itemsArray.forEach(function(item, i) {
    item.classList.add('reveal');
    item.addEventListener('click', function() { open(i); });
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '50px', threshold: 0.01 });

    itemsArray.forEach(function(item) {
      observer.observe(item);
    });
  } else {
    itemsArray.forEach(function(item, i) {
      setTimeout(function() { item.classList.add('visible'); }, i * 60);
    });
  }

  document.querySelector('.lightbox-close').addEventListener('click', close);
  document.querySelector('.lightbox-close').addEventListener('touchend', function(e) { e.preventDefault(); close(); });
  document.querySelector('.lightbox-prev').addEventListener('click', prev);
  document.querySelector('.lightbox-next').addEventListener('click', next);

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) close();
  });
  lightbox.addEventListener('touchend', function(e) {
    if (e.target === lightbox) { e.preventDefault(); close(); }
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
    var thumb = item.querySelector('img');
    lightboxImg.src = thumb ? thumb.src : (item.dataset.original + '?v=' + (item.dataset.version || '0'));
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCounter();

    var desc = item.dataset.description || '';
    updateCaption(desc, item.dataset.photoId || '');
  }

  function updateCaption(desc, photoId) {
    if (descText) descText.textContent = desc;
    if (descInput) {
      if (desc) {
        descInput.style.display = 'none';
        if (descText) descText.style.display = '';
      } else {
        descText.style.display = 'none';
        descInput.style.display = '';
        descInput.value = '';
      }
      descInput.dataset.photoId = photoId;
    }
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

  if (descInput) {
    descInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') saveDesc();
    });
    descInput.addEventListener('blur', saveDesc);
  }

  if (descText) {
    descText.addEventListener('click', function() {
      if (!descInput) return;
      descText.style.display = 'none';
      descInput.style.display = '';
      descInput.value = descText.textContent || '';
      descInput.focus();
    });
  }

  function saveDesc() {
    if (!descInput) return;
    var photoId = descInput.dataset.photoId;
    var desc = descInput.value.trim();
    if (!photoId) { descInput.style.display = 'none'; if (descText) descText.style.display = ''; return; }
    fetch('/api/admin/photos/' + photoId + '/description', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc })
    }).then(function(res) {
      if (res.ok) {
        descInput.style.display = 'none';
        if (descText) { descText.style.display = ''; descText.textContent = desc; }
      }
    });
  }
})();
