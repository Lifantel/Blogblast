let score = 0;
const scoreEl = document.getElementById('score');
const btn = document.getElementById('blastBtn');

btn.addEventListener('click', () => {
  score++;
  scoreEl.textContent = score;
  btn.style.transform = 'scale(1.1)';
  setTimeout(() => btn.style.transform = 'scale(1)', 150);
});
