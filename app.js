const searchInput = document.querySelector('input');
const logs = [...document.querySelectorAll('.logs > a')];

searchInput.onchange = e => {
  const { value } = e.target;

  logs.forEach(log => {
    const hasQuery = log.textContent.includes(value);
    log.style.display = hasQuery ? 'block' : 'none';
  });
};
