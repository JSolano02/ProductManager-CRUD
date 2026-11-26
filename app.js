'use strict';
const $ = (selector) => document.querySelector(selector);
const form = $('#product-form');
const feedback = $('#feedback');
const storageKey = 'productmanager.products.v1';
const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
let products = [];
let editingId = null;
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
function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function refresh() {
  $('#product-count').textContent = products.length;
  $('#unit-count').textContent = products.reduce((sum, p) => sum + p.quantity, 0);
  $('#inventory-value').textContent = money.format(products.reduce((sum, p) => sum + p.price * p.quantity, 0));
  const list = $('#product-list');
  list.replaceChildren();
  const query = normalize($('#search').value);
  const visible = products.filter(p => normalize(p.name).includes(query) || normalize(p.category).includes(query));
  for (const product of visible) {
    const row = document.createElement('tr');
    for (const value of [product.name, product.category, money.format(product.price), product.quantity]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    const actions = document.createElement('td');
    actions.className = 'actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'edit'; edit.textContent = 'Editar';
    edit.addEventListener('click', () => startEdit(product));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'delete'; remove.textContent = 'Eliminar';
    remove.addEventListener('click', () => deleteProduct(product));
    actions.append(edit, remove);
    row.append(actions);
    list.append(row);
  }
  $('#empty-state').hidden = visible.length > 0;
  $('#empty-state').textContent = products.length ? 'No se encontraron productos.' : 'Todavía no hay productos registrados.';
}
function deleteProduct(product) {
  if (!window.confirm('¿Eliminar el producto «' + product.name + '»?')) return;
  if (!persist(products.filter(p => p.id !== product.id))) return;
  if (editingId === product.id) resetForm();
  refresh();
  notify('Producto eliminado correctamente.');
}
function startEdit(product) {
  editingId = product.id;
  for (const field of ['name', 'category', 'price', 'quantity']) $('#' + field).value = product[field];
  $('#form-title').textContent = 'Editar producto';
  $('#save-button').textContent = 'Guardar cambios';
  $('#cancel-button').hidden = false;
  notify('Editando: ' + product.name);
  $('#name').focus();
}
function resetForm() {
  editingId = null;
  form.reset();
  $('#form-title').textContent = 'Registrar producto';
  $('#save-button').textContent = 'Guardar producto';
  $('#cancel-button').hidden = true;
}
$('#cancel-button').addEventListener('click', () => { resetForm(); notify('Edición cancelada.'); });
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = readForm();
  if (!valid(data)) { notify('Completa los datos con valores válidos.', true); return; }
  if (products.some(p => p.id !== editingId && normalize(p.name) === normalize(data.name) &&
      normalize(p.category) === normalize(data.category))) {
    notify('Ya existe un producto con ese nombre y categoría.', true); return;
  }
  const isEditing = editingId !== null;
  const next = isEditing ? products.map(p => p.id === editingId ? { ...p, ...data } : p)
    : [...products, { id: newId(), ...data }];
  if (!persist(next)) return;
  resetForm();
  $('#search').value = '';
  refresh();
  notify(isEditing ? 'Producto actualizado correctamente.' : 'Producto registrado correctamente.');
});
$('#search-area').hidden = false;
$('#search').addEventListener('input', refresh);
refresh();
