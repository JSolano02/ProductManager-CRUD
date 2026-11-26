'use strict';
const $ = (selector) => document.querySelector(selector);
const form = $('#product-form');
const feedback = $('#feedback');
const storageKey = 'productmanager.products.v1';
const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
let products = [];
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) products = saved;
} catch (error) { notify('No se pudo recuperar el inventario.', true); }
function notify(message, error = false) {
  feedback.textContent = message;
  feedback.classList.toggle('error', error);
}
function persist(next) {
  try { localStorage.setItem(storageKey, JSON.stringify(next)); }
  catch (error) { notify('No se pudieron guardar los cambios en el navegador.', true); return false; }
  products = next;
  return true;
}
function readForm() {
  return { name: $('#name').value.trim(), category: $('#category').value.trim(),
    price: $('#price').valueAsNumber, quantity: $('#quantity').valueAsNumber };
}
function valid(data) {
  return Boolean(data.name && data.category && Number.isFinite(data.price) && data.price >= 0 &&
    data.price <= 999999999 && Number.isInteger(data.quantity) && data.quantity >= 0 && data.quantity <= 999999999);
}
function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function refresh() {
  $('#product-count').textContent = products.length;
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = readForm();
  if (!valid(data)) { notify('Completa los datos con valores válidos.', true); return; }
  if (!persist([...products, { id: newId(), ...data }])) return;
  form.reset();
  refresh();
  notify('Producto registrado correctamente.');
});
refresh();
