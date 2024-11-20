const searchInput = document.querySelector('input');
const logs = [...document.querySelectorAll('.logs > a')];

searchInput.oninput = e => {
  const value = e.target.value.toLowerCase();

  logs.forEach(log => {
    const hasQuery = log.textContent.toLowerCase().includes(value);
    log.style.display = hasQuery ? 'block' : 'none';
  });
};
