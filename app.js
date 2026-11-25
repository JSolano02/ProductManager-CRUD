'use strict';
// Estructura inicial: las funciones se incorporan en ramas feature/.
const form = document.querySelector('#product-form');
const feedback = document.querySelector('#feedback');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  feedback.textContent = 'El registro de productos se implementará en la primera rama.';
});
