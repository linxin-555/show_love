(function() {
  var form = document.getElementById('msgForm');
  var errorEl = document.getElementById('msgError');
  var listEl = document.getElementById('messagesList');

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    errorEl.style.display = 'none';

    var formData = new FormData(form);
    var body = new URLSearchParams();
    for (var pair of formData) body.append(pair[0], pair[1]);

    try {
      var res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });
      var data = await res.json();
      if (data.ok) {
        prependMessage(data.message);
        form.reset();
      } else {
        errorEl.textContent = data.error;
        errorEl.style.display = 'block';
      }
    } catch (err) {
      errorEl.textContent = '网络错误，请重试';
      errorEl.style.display = 'block';
    }
  });

  function prependMessage(msg) {
    var empty = listEl.querySelector('.empty-state');
    if (empty) empty.remove();

    var card = document.createElement('div');
    card.className = 'msg-card';
    card.innerHTML =
      '<div class="msg-card-header">' +
        '<strong>' + escapeHtml(msg.nickname) + '</strong>' +
        '<span class="msg-date">' + formatDate(msg.createdAt) + '</span>' +
      '</div>' +
      '<p>' + escapeHtml(msg.content) + '</p>';

    listEl.insertBefore(card, listEl.firstChild);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('zh-CN');
  }
})();

function deleteMsg(id) {
  if (!confirm('确定删除这条留言？')) return;
  fetch('/api/messages/' + id, { method: 'DELETE' }).then(function(res) {
    if (res.ok) location.reload();
  });
}
