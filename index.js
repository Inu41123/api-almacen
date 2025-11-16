// ====================================================
// ¡¡IMPORTANTE!! Usa tu URL de localhost para probar
// ====================================================
const API_URL = 'http://localhost:3000/productos';

// --- Referencias del DOM ---
const formProducto = document.getElementById('form-producto');
const tablaProductos = document.getElementById('tabla-productos');
const imgPreview = document.getElementById('img-preview');
const inputImagen = document.getElementById('imagen');

// (Referencias de Filtros ELIMINADAS)

// Referencias del Modal de Edición
const modalEditar = new bootstrap.Modal(document.getElementById('modal-editar'));
const formEditar = document.getElementById('form-editar');
const btnGuardarCambios = document.getElementById('btn-guardar-cambios');

// Almacén global para los productos (se queda para la función de editar)
let todosLosProductos = [];


// --- Validación de Bootstrap (Se queda igual) ---
(function () {
    'use strict';
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
})();

// --- Previsualización de Imagen (Se queda igual) ---
inputImagen.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imgPreview.src = event.target.result;
            imgPreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        imgPreview.src = '';
        imgPreview.style.display = 'none';
    }
});

// --- (Sección de Filtros ELIMINADA) ---

// --- (MODIFICADO) Pintar la Tabla ---
// (Simplificada: ya no llama a 'aplicarFiltros')
function pintarTabla(productos) {
    tablaProductos.innerHTML = ''; // Limpiar la tabla

    if (productos.length === 0) {
        tablaProductos.innerHTML = '<tr><td colspan="5" class="text-center">No hay productos en el almacén.</td></tr>';
        return;
    }

    productos.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${prod.imageUrl}" alt="${prod.nombre}" width="75" class="img-thumbnail">
            </td>
            <td>${prod.nombre}</td>
            <td><span class="badge bg-secondary">${prod.category}</span></td>
            <td>${prod.stock}</td>
            <td>
                <button class="btn btn-warning btn-sm" 
                    onclick="abrirModalEditar('${prod._id}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" 
                    onclick="borrarProducto('${prod._id}')">
                    Borrar
                </button>
            </td>
        `;
        tablaProductos.appendChild(tr);
    });
}

// --- READ (Cargar productos de la API) ---
async function cargarProductos() {
    try {
        const respuesta = await fetch(API_URL);
        todosLosProductos = await respuesta.json(); // Guardamos en el almacén global
        
        if (!respuesta.ok) throw new Error('Error al cargar productos');
        
        pintarTabla(todosLosProductos); // Pintamos la tabla con todos los productos

    } catch (error) {
        console.error('Error al cargar productos:', error);
        tablaProductos.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos.</td></tr>';
    }
}

// --- CREATE (Se queda igual) ---
formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!formProducto.checkValidity()) {
        formProducto.classList.add('was-validated');
        return;
    }
    const formData = new FormData(formProducto);
    const btnSubmit = formProducto.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Guardando...';
    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            body: formData 
        });
        const nuevoProducto = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(nuevoProducto.mensaje || 'Error al crear el producto');
        }
        console.log('Producto creado:', nuevoProducto);
        formProducto.reset();
        formProducto.classList.remove('was-validated');
        imgPreview.style.display = 'none';
        cargarProductos();
    } catch (error) {
        console.error('Error al crear producto:', error);
        alert('Error al crear producto: ' + error.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Guardar Producto';
    }
});

// --- DELETE (Se queda igual) ---
async function borrarProducto(id) {
    if (!confirm('¿Seguro que quieres borrar este producto? Esta acción no se puede deshacer.')) {
        return;
    }
    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        const data = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(data.mensaje || 'Error al borrar');
        }
        console.log(data.mensaje);
        cargarProductos();
    } catch (error) {
        console.error('Error al borrar:', error);
        alert('Error al borrar: ' + error.message);
    }
}

// --- UPDATE (Se queda igual) ---
function abrirModalEditar(id) {
    const producto = todosLosProductos.find(p => p._id === id);
    if (!producto) return;
    document.getElementById('edit-id').value = producto._id;
    document.getElementById('edit-nombre').value = producto.nombre;
    document.getElementById('edit-descripcion').value = producto.descripcion;
    document.getElementById('edit-stock').value = producto.stock;
    document.getElementById('edit-category').value = producto.category;
    document.getElementById('edit-imagen').value = '';
    modalEditar.show();
}

btnGuardarCambios.addEventListener('click', async () => {
    const formData = new FormData(formEditar);
    const id = formData.get('id');
    btnGuardarCambios.disabled = true;
    btnGuardarCambios.innerText = 'Guardando...';
    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            body: formData
        });
        const productoActualizado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(productoActualizado.mensaje || 'Error al actualizar');
        }
        console.log('Producto actualizado:', productoActualizado);
        modalEditar.hide();
        cargarProductos();
    } catch (error) {
        console.error('Error al actualizar:', error);
        alert('Error al actualizar: ' + error.message);
    } finally {
        btnGuardarCambios.disabled = false;
        btnGuardarCambios.innerText = 'Guardar Cambios';
    }
});


// --- ¡Arrancamos! ---
cargarProductos();